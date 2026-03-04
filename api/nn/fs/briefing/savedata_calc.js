/*---------------------------------------------------------------------------*
  Project:  Horizon
  File:     savedata_calc.js

  Copyright (C)2009 Nintendo Co., Ltd.  All rights reserved.

  These coded instructions, statements, and computer programs contain
  proprietary information of Nintendo of America Inc. and/or Nintendo
  Company Ltd., and are protected by federal copyright law. They may
  not be disclosed to third parties or copied or duplicated in any form,
  in whole or in part, without the prior written consent of Nintendo.

  $Rev:$
 *---------------------------------------------------------------------------*/

/*===========================================================================*/
/*!
    @brief Alignment adjustment function.
*/
function AdjustAlignment(val, alignment)
{
    return Math.floor((val + (alignment - 1)) / alignment) * alignment;
};

/*===========================================================================*/
/*!
    @brief Counts the number of consecutive 0 bits starting from the left of the bit sequence.
*/
function CntLz(val)
{
    var x = 0;

    var n = 32;
    var c = 16;
    do
    {
        x = val >> c;
        if (x != 0)
        {
            n -= c;
            val = x;
        }
        c >>= 1;
    } while(c != 0);

    return (n - val);
};

/*---------------------------------------------------------------------------*/
/*!
    @brief Determines whether a value is an integer power of 2.
*/
function IsPwr2(val)
{
    return (0 == (val & (val - 1)));
};

/*---------------------------------------------------------------------------*/
/*!
    @brief Calculates the base 2 logarithm of an integer and returns the result as an integer.
*/
function ILog2(val)
{
    return 31 - CntLz(val);
};

/*---------------------------------------------------------------------------*/
/*!
    @brief Exception definition.
*/
function ResultInvalidArgument()
{
};

/*===========================================================================*/
/*!
    @brief Entry map table.
    @ref EntryMapTable.
*/
function EntryMapTable()
{
};

/*---------------------------------------------------------------------------*/

EntryMapTable.STORAGE_SYSTEM_RESERVED = 1;

EntryMapTable.DIRECTORY_SYSTEM_RESERVED = 1;
EntryMapTable.FILE_SYSTEM_RESERVED = 0;

EntryMapTable.INDEX_SIZE = 4; // sizeof(u32)
EntryMapTable.STORAGE_INDEX_SIZE = 4; // sizeof(u32)

EntryMapTable.DIRECTORY_NAME_SIZE = 16;
EntryMapTable.FILE_NAME_SIZE = 16;

EntryMapTable.DIRECTORY_INFO_SIZE = 4; // sizeof(bit8[4])

EntryMapTable.FILE_SYSTEM_INFO_SIZE = 4 + // sizeof(u32)
                                          8;  // sizeof(S64)
EntryMapTable.FILE_OPTIONAL_INFO_SIZE = 4; // sizeof(bit8[4])
EntryMapTable.FILE_INFO_SIZE = EntryMapTable.FILE_NAME_SIZE;

EntryMapTable.DIRECTORY_KEY_SIZE = EntryMapTable.STORAGE_INDEX_SIZE +
                                   EntryMapTable.DIRECTORY_NAME_SIZE;
EntryMapTable.DIRECTORY_VALUE_SIZE = EntryMapTable.STORAGE_INDEX_SIZE +
                                     EntryMapTable.STORAGE_INDEX_SIZE +
                                     EntryMapTable.STORAGE_INDEX_SIZE +
                                     EntryMapTable.DIRECTORY_INFO_SIZE;

EntryMapTable.FILE_KEY_SIZE = EntryMapTable.STORAGE_INDEX_SIZE +
                              EntryMapTable.DIRECTORY_NAME_SIZE;
EntryMapTable.FILE_VALUE_SIZE = EntryMapTable.STORAGE_INDEX_SIZE +
                                4 + // PADDING4
                                EntryMapTable.FILE_INFO_SIZE;

EntryMapTable.DIRECTORY_STORAGE_ELEMENT_SIZE = EntryMapTable.DIRECTORY_KEY_SIZE +
                                               EntryMapTable.DIRECTORY_VALUE_SIZE +
                                               EntryMapTable.INDEX_SIZE;

EntryMapTable.FILE_STORAGE_ELEMENT_SIZE = EntryMapTable.FILE_KEY_SIZE +
                                          EntryMapTable.FILE_VALUE_SIZE +
                                          EntryMapTable.INDEX_SIZE;

/*---------------------------------------------------------------------------*/

EntryMapTable.QueryDirectoryEntryStorageSize = function(countDirectoryEntry)
{
    return ((countDirectoryEntry + EntryMapTable.DIRECTORY_SYSTEM_RESERVED)
             + EntryMapTable.STORAGE_SYSTEM_RESERVED) * EntryMapTable.DIRECTORY_STORAGE_ELEMENT_SIZE;
};

/*---------------------------------------------------------------------------*/

EntryMapTable.QueryFileEntryStorageSize = function(countFileEntry)
{
    return ((countFileEntry + EntryMapTable.FILE_SYSTEM_RESERVED)
            + EntryMapTable.STORAGE_SYSTEM_RESERVED) * EntryMapTable.FILE_STORAGE_ELEMENT_SIZE;
};

/*---------------------------------------------------------------------------*/

EntryMapTable.QueryDirectoryEntryBucketStorageSize = function(countDirectoryBucket)
{
    return countDirectoryBucket * EntryMapTable.INDEX_SIZE;
};

/*---------------------------------------------------------------------------*/

EntryMapTable.QueryFileEntryBucketStorageSize = function(countFileBucket)
{
    return countFileBucket * EntryMapTable.INDEX_SIZE;
};

/*===========================================================================*/
/*!
    @brief Allocation table.
    @ref AllocationTableTemplate.
*/
function AllocationTable()
{
};

/*---------------------------------------------------------------------------*/

AllocationTable.SECTOR_RESERVED_COUNT = 1;

AllocationTable.TABLE_ELEMENT_SIZE = 4 // sizeof(u32)
                                   + 4;// sizeof(u32)

/*---------------------------------------------------------------------------*/

AllocationTable.QuerySize = function(blockCount)
{
    return (blockCount + AllocationTable.SECTOR_RESERVED_COUNT)
            * AllocationTable.TABLE_ELEMENT_SIZE;
};

/*===========================================================================*/
/*!
    @brief File system management information.
    @ref HierarchicalDuplexFile.
*/
function FileSystemControlArea()
{
};

/*---------------------------------------------------------------------------*/

FileSystemControlArea.STORAGE_INFO_SIZE = 8 // sizeof(s64)
                                        + 4 // sizeof(u32)
                                        + 4;// PADDING4

FileSystemControlArea.ALLOCATION_INFO_SIZE = 4 // sizeof(u32)
                                           + 4 // sizeof(size_t)
                                           + 4 // sizeof(u32)
                                           + 4;// PADDING4

/*---------------------------------------------------------------------------*/

FileSystemControlArea.QuerySize = function()
{
    var STORAGE_OR_ALLOCATION_INFO_SIZE = FileSystemControlArea.STORAGE_INFO_SIZE;
    if (FileSystemControlArea.STORAGE_INFO_SIZE < FileSystemControlArea.ALLOCATION_INFO_SIZE)
    {
        STORAGE_OR_ALLOCATION_INFO_SIZE = FileSystemControlArea.ALLOCATION_INFO_SIZE;
    }

    return (4
          + 4
          + FileSystemControlArea.STORAGE_INFO_SIZE
          + FileSystemControlArea.STORAGE_INFO_SIZE
          + FileSystemControlArea.STORAGE_INFO_SIZE
          + FileSystemControlArea.STORAGE_INFO_SIZE
          + STORAGE_OR_ALLOCATION_INFO_SIZE
          + STORAGE_OR_ALLOCATION_INFO_SIZE);
};

/*===========================================================================*/
/*!
    @brief Hierarchical duplex file.
    @ref HierarchicalDuplexFile.
*/
function HierarchicalDuplexFile()
{
};

/*---------------------------------------------------------------------------*/

HierarchicalDuplexFile.DPFS_BITMAP_ALIGN = 4;
HierarchicalDuplexFile.MAX_LAYERS = 3; // Master, L1, BODY

HierarchicalDuplexFile.LEVEL_INFO_SIZE = 8 // sizeof(Int64)
                                       + 8 // sizeof(Int64)
                                       + 4 // sizeof(s32)
                                       + 4;// PADDING4

HierarchicalDuplexFile.INFOMATION_SIZE = HierarchicalDuplexFile.LEVEL_INFO_SIZE
                                       * HierarchicalDuplexFile.MAX_LAYERS;

HierarchicalDuplexFile.META_INFO_SIZE = 4 // sizeof(u32)
                                      + 4 // sizeof(u32)
                                      + HierarchicalDuplexFile.INFOMATION_SIZE

/*---------------------------------------------------------------------------*/

HierarchicalDuplexFile.InputParam = function()
{
    this.sizeBlockLevel = new Array(2);
};

/*---------------------------------------------------------------------------*/

HierarchicalDuplexFile.LevelInfomation = function()
{
    this.offset = 0;
    this.size = 0;
    this.orderBlock = 0;
};

/*---------------------------------------------------------------------------*/

HierarchicalDuplexFile.QuerySizeResult = function()
{
    this.sizeControlArea = 0;
    this.sizeBody = 0;
};

/*---------------------------------------------------------------------------*/

HierarchicalDuplexFile.QuerySize = function(
                                       outResult,
                                       inputParam,
                                       sizeData
                                   )
{
    if (inputParam.sizeBlockLevel[0] <= 0 || !IsPwr2(inputParam.sizeBlockLevel[0])
     || inputParam.sizeBlockLevel[1] <= 0 || !IsPwr2(inputParam.sizeBlockLevel[1]))
    {
        throw new ResultInvalidArgument();
    }

    if (0 != (sizeData % inputParam.sizeBlockLevel[1]))
    {
        throw new ResultInvalidArgument();
    }

    if (inputParam.sizeBlockLevel[0] < HierarchicalDuplexFile.DPFS_BITMAP_ALIGN
     || inputParam.sizeBlockLevel[1] < HierarchicalDuplexFile.DPFS_BITMAP_ALIGN)
    {
        throw new ResultInvalidArgument();
    }

    // Determines the size of the management region.
    outResult.sizeControlArea = HierarchicalDuplexFile.META_INFO_SIZE;

    var MAX_LEVEL = HierarchicalDuplexFile.MAX_LAYERS;
    
    var sizeLevel = new Array(MAX_LEVEL);
    // Body.
    sizeLevel[2] = sizeData;
    // Data size, in bits.
    sizeLevel[1] = Math.floor(((sizeLevel[2] + inputParam.sizeBlockLevel[1] - 1) / inputParam.sizeBlockLevel[1]));
    // Converts bits to bytes.
    sizeLevel[1] = Math.floor((sizeLevel[1] + 7) / 8);
    // Aligns the size to the L1 block boundary.
    sizeLevel[1] = AdjustAlignment(sizeLevel[1], inputParam.sizeBlockLevel[0]);
    // Bits.
    sizeLevel[0] = Math.floor(((sizeLevel[1] + inputParam.sizeBlockLevel[0] - 1) / inputParam.sizeBlockLevel[0]));
    // Converts bits to bytes.
    sizeLevel[0] = Math.floor((sizeLevel[0] + 7) / 8);
    // Aligns the size to the byte boundary of <tt>DPFS_BITMAP_ALIGN</tt>.
    sizeLevel[0] = AdjustAlignment(sizeLevel[0], HierarchicalDuplexFile.DPFS_BITMAP_ALIGN);

    var orderBlock = new Array(MAX_LEVEL);

    orderBlock[0] = 0;
    orderBlock[1] = ILog2(inputParam.sizeBlockLevel[0]);
    orderBlock[2] = ILog2(inputParam.sizeBlockLevel[1]);

    // <tt>Master</tt> and <tt>L1</tt> are aligned to at least <tt>DPFS_BITMAP_ALIGN</tt>.
    var offset = 0;

    var levelInfo = new Array(MAX_LEVEL);
    var level;

    for (level = 0; level < MAX_LEVEL; level++)
    {
        levelInfo[level] = new HierarchicalDuplexFile.LevelInfomation();

        // The actual data is aligned to the L2 block size.
        if (level == MAX_LEVEL - 1)
        {
            offset = AdjustAlignment(offset, inputParam.sizeBlockLevel[1]);
        }

        levelInfo[level].offset = offset;
        levelInfo[level].size = sizeLevel[level];
        levelInfo[level].orderBlock = orderBlock[level];
        offset += sizeLevel[level] * 2;
    }

    // Determines the size of the actual data.
    outResult.sizeBody = offset;
};

/*===========================================================================*/
/*!
    @brief Hierarchical integrity verification file.
    @ref HierarchicalDuplexFile.
*/
function HierarchicalIntegrityVerificationFile()
{
};

/*---------------------------------------------------------------------------*/

HierarchicalIntegrityVerificationFile.HASH_SIZE = Math.floor(256 / 8);
HierarchicalIntegrityVerificationFile.MAX_LAYERS = 5; // Master, L1, L2, L3, BODY

HierarchicalIntegrityVerificationFile.LEVEL_INFO_SIZE = 8 // sizeof(Int64)
                                                      + 8 // sizeof(Int64)
                                                      + 4 // sizeof(s32)
                                                      + 4;// PADDING4
HierarchicalIntegrityVerificationFile.INFOMATION_SIZE = 4 // sizeof(u32)
                                                      + HierarchicalIntegrityVerificationFile.LEVEL_INFO_SIZE
                                                        * (HierarchicalIntegrityVerificationFile.MAX_LAYERS - 1);
HierarchicalIntegrityVerificationFile.META_INFO_SIZE = 4 // sizeof(u32)
                                                     + 4 // sizeof(u32)
                                                     + 4 // sizeof(u32)
                                                     + HierarchicalIntegrityVerificationFile.INFOMATION_SIZE
                                                     + 4 // sizeof(u32)
                                                     + 4; // sizeof(u32)

/*---------------------------------------------------------------------------*/

HierarchicalIntegrityVerificationFile.InputParam = function()
{
    this.sizeOptionalInfo = 0;
    this.sizeBlockLevel = new Array(HierarchicalIntegrityVerificationFile.MAX_LAYERS - 1);
};

/*---------------------------------------------------------------------------*/

HierarchicalIntegrityVerificationFile.LevelInfomation = function()
{
    this.offset = 0;
    this.size = 0;
    this.orderBlock = 0;
};

/*---------------------------------------------------------------------------*/

HierarchicalIntegrityVerificationFile.QuerySizeResult = function()
{
    this.sizeControlArea = 0;
    this.sizeMasterHash = 0;
    this.sizeLayerdHash = 0;
    this.sizeBody = 0;
    this.sizeTotal = 0;
};

/*---------------------------------------------------------------------------*/

HierarchicalIntegrityVerificationFile.QuerySize = function(
                                                      outResult,
                                                      inputParam,
                                                      sizeData
                                                  )
{
    if (inputParam.sizeBlockLevel[0] <= 0 || !IsPwr2(inputParam.sizeBlockLevel[0])
     || inputParam.sizeBlockLevel[1] <= 0 || !IsPwr2(inputParam.sizeBlockLevel[1])
     || inputParam.sizeBlockLevel[2] <= 0 || !IsPwr2(inputParam.sizeBlockLevel[2])
     || inputParam.sizeBlockLevel[3] <= 0 || !IsPwr2(inputParam.sizeBlockLevel[3]))
    {
        throw new ResultInvalidArgument();
    }

    var offset = 0;
    offset += HierarchicalIntegrityVerificationFile.META_INFO_SIZE;
    offset = AdjustAlignment(offset, 4);

    offset += inputParam.sizeOptionalInfo;
    // Determines the size of the management region.
    outResult.sizeControlArea = offset;

    var MAX_LEVEL = HierarchicalIntegrityVerificationFile.MAX_LAYERS;
    var HASH_SIZE = HierarchicalIntegrityVerificationFile.HASH_SIZE;

    var sizeLevel = new Array(MAX_LEVEL);

    // Body.
    sizeLevel[4] = sizeData;
    // L3
    sizeLevel[3] = Math.floor(((sizeLevel[4] + inputParam.sizeBlockLevel[3] - 1) / inputParam.sizeBlockLevel[3])) * HASH_SIZE;
    // L2
    sizeLevel[2] = Math.floor(((sizeLevel[3] + inputParam.sizeBlockLevel[2] - 1) / inputParam.sizeBlockLevel[2])) * HASH_SIZE;
    // L1
    sizeLevel[1] = Math.floor(((sizeLevel[2] + inputParam.sizeBlockLevel[1] - 1) / inputParam.sizeBlockLevel[1])) * HASH_SIZE;
    // Master
    sizeLevel[0] = Math.floor(((sizeLevel[1] + inputParam.sizeBlockLevel[0] - 1) / inputParam.sizeBlockLevel[0])) * HASH_SIZE;

    var orderBlock = new Array(MAX_LEVEL);

    orderBlock[1] = ILog2(inputParam.sizeBlockLevel[0]);
    orderBlock[2] = ILog2(inputParam.sizeBlockLevel[1]);
    orderBlock[3] = ILog2(inputParam.sizeBlockLevel[2]);
    orderBlock[4] = ILog2(inputParam.sizeBlockLevel[3]);

    // Determines the size of the master hash.
    outResult.sizeMasterHash = sizeLevel[0];

    // Constructs the level information.
    var levelInfo = new Array(MAX_LEVEL);
    var level;

    offset = 0;
    for (level = 1; level < MAX_LEVEL; level++)
    {
        levelInfo[level - 1] = new HierarchicalIntegrityVerificationFile.LevelInfomation();

        if (sizeLevel[level] >= (4 << orderBlock[level]))
        {
            offset = AdjustAlignment(offset, 1 << orderBlock[level]);
        }
        else
        {
            offset = AdjustAlignment(offset, 8/*sizeof(s64)*/);
        }

        levelInfo[level - 1].offset = offset;
        levelInfo[level - 1].size = sizeLevel[level];
        levelInfo[level - 1].orderBlock = orderBlock[level];
        offset += sizeLevel[level];
    }

    // Determines the size of the layer hash.
    outResult.sizeLayeredHash = levelInfo[MAX_LEVEL - 3].offset
                              + levelInfo[MAX_LEVEL - 3].size
                              - levelInfo[0].offset;

    // Determines the size of the actual data.
    outResult.sizeBody = levelInfo[MAX_LEVEL - 2].size;

    // Determines the total size.
    outResult.sizeTotal = levelInfo[MAX_LEVEL - 2].offset
                        + levelInfo[MAX_LEVEL - 2].size
                        - levelInfo[0].offset;
};

/*===========================================================================*/
/*!
    @brief Duplicated + integrity verification file.
    @ref DuplicatedIntegrityFile.
*/
function DuplicatedIntegrityFile()
{
};

/*---------------------------------------------------------------------------*/

DuplicatedIntegrityFile.META_INFO_SIZE = 4 // sizeof(u32)
                                       + 4 // sizeof(u32)
                                       + 8 // sizeof(Int64)
                                       + 8 // sizeof(Int64)
                                       + 8 // sizeof(Int64)
                                       + 8 // sizeof(Int64)
                                       + 8 // sizeof(Int64)
                                       + 8 // sizeof(Int64)
                                       + 1 // sizeof(bool)
                                       + 1 // sizeof(bool)
                                       + 2 // PADDING2
                                       + 8;// sizeof(Int64)

/*---------------------------------------------------------------------------*/

DuplicatedIntegrityFile.QuerySizeResult = function()
{
    this.sizeControlArea = 0;
    this.sizeTotalBody = 0;
};

/*---------------------------------------------------------------------------*/

DuplicatedIntegrityFile.QuerySize = function(
                                        outResult,
                                        inputParamDuplex,
                                        inputParamIntegrity,
                                        sizeOriginalData,
                                        isDuplicateOnlyHash
                                    )
{
    // Calculates the size of the file for verifying completeness of the hierarchy.
    var resultIntegrity = new HierarchicalIntegrityVerificationFile.QuerySizeResult();

    HierarchicalIntegrityVerificationFile.QuerySize(
                                              resultIntegrity,
                                              inputParamIntegrity,
                                              sizeOriginalData
                                          );

    var sizeDuplicateOriginal = 0;

    if (!isDuplicateOnlyHash)
    {
        sizeDuplicateOriginal = AdjustAlignment(resultIntegrity.sizeTotal, inputParamDuplex.sizeBlockLevel[1]);
    }
    else
    {
        sizeDuplicateOriginal = AdjustAlignment(resultIntegrity.sizeLayeredHash, inputParamDuplex.sizeBlockLevel[1]);
    }

    // Calculates the size of the file for hierarchy duplexing.
    var resultDuplex = new HierarchicalDuplexFile.QuerySizeResult();

    HierarchicalDuplexFile.QuerySize(
                               resultDuplex,
                               inputParamDuplex,
                               sizeDuplicateOriginal
                           );

    // Calculates the size of the file for verification of duplexing and completeness.
    var offsetOriginalData;
    if (!isDuplicateOnlyHash)
    {
        offsetOriginalData = 0;
        outResult.sizeTotalBody = resultDuplex.sizeBody;
    }
    else
    {
        // Places the actual data after the duplicated signature data.
        offsetOriginalData = AdjustAlignment(resultDuplex.sizeBody, inputParamIntegrity.sizeBlockLevel[3]);
        outResult.sizeTotalBody = offsetOriginalData + sizeOriginalData;
    }

    // Metadata.
    var offset = DuplicatedIntegrityFile.META_INFO_SIZE;

    // Management region for the integrity verification layer.
    offset = AdjustAlignment(offset, 4);
    offset += resultIntegrity.sizeControlArea;

    // Region for managing the duplexing layer.
    offset = AdjustAlignment(offset, 4);
    offset += resultDuplex.sizeControlArea;

    // Master signature.
    offset = AdjustAlignment(offset, 4);
    offset += resultIntegrity.sizeMasterHash;

    // Final size of the management region.
    outResult.sizeControlArea = offset;
};

/*===========================================================================*/
/*!
    @brief Duplicated + integrity verification filter file.
    @ref DuplicatedIntegrityFile.
*/
function DuplicatedIntegrityFilterFile()
{
};

/*---------------------------------------------------------------------------*/

DuplicatedIntegrityFilterFile.ATOMIC_HEADER_SIZE = 512;

/*---------------------------------------------------------------------------*/

DuplicatedIntegrityFilterFile.QuerySizeResult = function()
{
    this.sizeTotalBody = 0;
};

/*---------------------------------------------------------------------------*/

DuplicatedIntegrityFilterFile.QuerySize = function(
                                              outResult,
                                              inputParamDuplex,
                                              inputParamIntegrity,
                                              sizeOriginalData,
                                              isDuplicateOnlyHash
                                          )
{
    // The filter file does not use the option region.
    inputParamDuplex.sizeOptionalInfo = 0;

    // Gets the size of the management region for duplicated files with integrity verification.
    var resultDupInt = new DuplicatedIntegrityFile.QuerySizeResult();
    DuplicatedIntegrityFile.QuerySize(
                                resultDupInt,
                                inputParamDuplex,
                                inputParamIntegrity,
                                sizeOriginalData,
                                isDuplicateOnlyHash
                            );

    var offset = DuplicatedIntegrityFilterFile.ATOMIC_HEADER_SIZE;

    // Duplicated management region A.
    offset = AdjustAlignment(offset, 8/*sizeof(s64)*/);
    offset += resultDupInt.sizeControlArea;

    // Duplicated management region A.
    offset = AdjustAlignment(offset, 8/*sizeof(s64)*/);
    offset += resultDupInt.sizeControlArea;

    var maxBlockSize = ((inputParamDuplex.sizeBlockLevel[0] - 1) |
                        (inputParamDuplex.sizeBlockLevel[1] - 1) |
                        (inputParamIntegrity.sizeBlockLevel[0] - 1) |
                        (inputParamIntegrity.sizeBlockLevel[1] - 1) |
                        (inputParamIntegrity.sizeBlockLevel[2] - 1) |
                        (inputParamIntegrity.sizeBlockLevel[3] - 1)) + 1;

    // Places the data portion after the management region for the duplexing file that has verification features, while continuining to insert padding.
    // 
    offset = AdjustAlignment(offset, maxBlockSize);
    offset += resultDupInt.sizeTotalBody;;

    // Returns the final size.
    outResult.sizeTotalBody = offset;
};

/*===========================================================================*/
/*!
    @brief The archive class for transparently handling an archive with a file ID as a path using a string path.
    @ref WStringOnBit64PathStorageArchive.
*/
function WStringOnBit64PathStorageArchive()
{
};

/*---------------------------------------------------------------------------*/

WStringOnBit64PathStorageArchive.MAX_PATH_LENGTH = 256;

WStringOnBit64PathStorageArchive.ARCHIVE_HEADER_SIZE = 4 // sizeof(u32)
                                                     + 4 // sizeof(u32)
                                                     + 8 // sizeof(s64)
                                                     + 8 // sizeof(s64)
                                                     + 4 // sizeof(u32)
                                                     + 4 // PADDING4
                                                     + 8
                                                     + (
                                                         4 // sizeof(bit32)
                                                       + 8 // sizeof(FileId) -> sizeof(bit64)
                                                       + WStringOnBit64PathStorageArchive.MAX_PATH_LENGTH
                                                       ) // sizeof(transaction)
                                                     ;

/*---------------------------------------------------------------------------*/

WStringOnBit64PathStorageArchive.QueryHeaderSize = function()
{
    return WStringOnBit64PathStorageArchive.ARCHIVE_HEADER_SIZE;
};

/*---------------------------------------------------------------------------*/

WStringOnBit64PathStorageArchive.QueryFileSystemControlAreaSize = function()
{
    return FileSystemControlArea.QuerySize();
};

/*---------------------------------------------------------------------------*/

WStringOnBit64PathStorageArchive.QueryDirectoryEntryStorageSize = function(countDirectoryEntry)
{
    return EntryMapTable.QueryDirectoryEntryStorageSize(countDirectoryEntry);
};

/*---------------------------------------------------------------------------*/

WStringOnBit64PathStorageArchive.QueryDirectoryEntryBucketStorageSize = function(countDirectoryBucket)
{
    return EntryMapTable.QueryDirectoryEntryBucketStorageSize(countDirectoryBucket);
};

/*---------------------------------------------------------------------------*/

WStringOnBit64PathStorageArchive.QueryFileEntryStorageSize = function(countFileEntry)
{
    return EntryMapTable.QueryFileEntryStorageSize(countFileEntry);
};

/*---------------------------------------------------------------------------*/

WStringOnBit64PathStorageArchive.QueryFileEntryBucketStorageSize = function(countFileBucket)
{
    return EntryMapTable.QueryFileEntryBucketStorageSize(countFileBucket);
};

/*---------------------------------------------------------------------------*/

WStringOnBit64PathStorageArchive.QueryAllocationTableStorageSize = function(countDataBlock)
{
    return AllocationTable.QuerySize(countDataBlock);
};

/*---------------------------------------------------------------------------*/

WStringOnBit64PathStorageArchive.QueryOptimalBucketCount = function(countEntries)
{
    if (countEntries <= 3)
    {
        // When there are extremely few entries, returns a fixed size for the number of buckets.
        return 3;
    }
    if (countEntries <= 19)
    {
        // If there are fewer than 20 entries, returns an odd number.
        return countEntries | 1;
    }

    // When there are more than twenty entries, pruning with a low prime number occurs, in consideration of packet breakup.
    // 
    var i;
    for (i = 0;i < 100;i++)
    {
        var candidate = (countEntries + i);
        if (
            (candidate % 2) != 0 &&
            (candidate % 3) != 0 &&
            (candidate % 5) != 0 &&
            (candidate % 7) != 0 &&
            (candidate % 11) != 0 &&
            (candidate % 13) != 0 &&
            (candidate % 17) != 0
        )
        {
            return candidate;
        }
    }
    return countEntries | 1;
};

/*---------------------------------------------------------------------------*/

WStringOnBit64PathStorageArchive.QueryTotalSize = function(
                                     countDirectoryEntry,
                                     countDirectoryEntryBucket,
                                     countFileEntry,
                                     countFileEntryBucket,
                                     sizeBlock
                                 )
{
    var sizeDirectoryEntry = WStringOnBit64PathStorageArchive.QueryDirectoryEntryStorageSize(countDirectoryEntry);
    var blockCountDirectoryEntry = Math.floor((sizeDirectoryEntry + sizeBlock - 1) / sizeBlock);
    var sizeFileEntry = WStringOnBit64PathStorageArchive.QueryFileEntryStorageSize(countFileEntry);
    var blockCountFileEntry = Math.floor((sizeFileEntry + sizeBlock - 1) / sizeBlock);
    var sizeFixed =
        WStringOnBit64PathStorageArchive.QueryHeaderSize() +
        WStringOnBit64PathStorageArchive.QueryFileSystemControlAreaSize() +
        WStringOnBit64PathStorageArchive.QueryDirectoryEntryBucketStorageSize(countDirectoryEntryBucket) +
        WStringOnBit64PathStorageArchive.QueryFileEntryBucketStorageSize(countFileEntryBucket) +
        WStringOnBit64PathStorageArchive.QueryAllocationTableStorageSize(blockCountDirectoryEntry + blockCountFileEntry)
        ;
    sizeFixed = AdjustAlignment(sizeFixed, sizeBlock);
    return sizeFixed + sizeBlock * (blockCountDirectoryEntry + blockCountFileEntry);
}

/*===========================================================================*/
/*!
    @brief Save data archive class.
    @ref SaveDataArchiveTemplate.
*/
function SaveDataArchive()
{
};

/*---------------------------------------------------------------------------*/

SaveDataArchive.ARCHIVE_HEADER_SIZE = 4 // sizeof(u32)
                                    + 4 // sizeof(u32)
                                    + 8 // sizeof(s64)
                                    + 8 // sizeof(s64)
                                    + 4 // sizeof(u32)
                                    + 4;// PADDING4

/*---------------------------------------------------------------------------*/

SaveDataArchive.QueryHeaderSize = function()
{
    return SaveDataArchive.ARCHIVE_HEADER_SIZE;
};

/*---------------------------------------------------------------------------*/

SaveDataArchive.QueryFileSystemControlAreaSize = function()
{
    return FileSystemControlArea.QuerySize();
};

/*---------------------------------------------------------------------------*/

SaveDataArchive.QueryDirectoryEntryStorageSize = function(countDirectoryEntry)
{
    return EntryMapTable.QueryDirectoryEntryStorageSize(countDirectoryEntry);
};

/*---------------------------------------------------------------------------*/

SaveDataArchive.QueryDirectoryEntryBucketStorageSize = function(countDirectoryBucket)
{
    return EntryMapTable.QueryDirectoryEntryBucketStorageSize(countDirectoryBucket);
};

/*---------------------------------------------------------------------------*/

SaveDataArchive.QueryFileEntryStorageSize = function(countFileEntry)
{
    return EntryMapTable.QueryFileEntryStorageSize(countFileEntry);
};

/*---------------------------------------------------------------------------*/

SaveDataArchive.QueryFileEntryBucketStorageSize = function(countFileBucket)
{
    return EntryMapTable.QueryFileEntryBucketStorageSize(countFileBucket);
};

/*---------------------------------------------------------------------------*/

SaveDataArchive.QueryAllocationTableStorageSize = function(countDataBlock)
{
    return AllocationTable.QuerySize(countDataBlock);
};

/*---------------------------------------------------------------------------*/

SaveDataArchive.QueryOptimalBucketCount = function(countEntries)
{
    // TODO: Consider standardizing to <tt>WStringOnBit64PathStorageArchive.QueryOptimalBucketCount</tt>.
    if (countEntries <= 3)
    {
        // When there are extremely few entries, returns a fixed size for the number of buckets.
        return 3;
    }
    if (countEntries <= 19)
    {
        // If there are fewer than 20 entries, returns an odd number.
        return countEntries | 1;
    }

    // When there are more than twenty entries, pruning with a low prime number occurs, in consideration of packet breakup.
    // 
    var i;
    for (i = 0; i < 100; i++)
    {
        var candidate = (countEntries + i);
        if (
            (candidate % 2) != 0 &&
            (candidate % 3) != 0 &&
            (candidate % 5) != 0 &&
            (candidate % 7) != 0 &&
            (candidate % 11) != 0 &&
            (candidate % 13) != 0 &&
            (candidate % 17) != 0
        )
        {
            return candidate;
        }
    }
    return countEntries | 1;
};

/*---------------------------------------------------------------------------*/

SaveDataArchive.QueryMinDataSize = function(
                                       countDirectoryEntry,
                                       countFileEntry,
                                       countDirectoryBucket,
                                       countFileBucket,
                                       sizeBlock,
                                       countDataBlock
                                   )
{
    if (countDirectoryBucket <= 0 || countFileBucket <= 0)
    {
        throw new ResultInvalidArgument();
    }
/*
    var sizeDirectoryEntry = SaveDataArchive.QueryDirectoryEntryStorageSize(countDirectoryEntry);
    var blockCountDirectoryEntry = Math.floor((sizeDirectoryEntry + sizeBlock - 1) / sizeBlock);
    var sizeFileEntry = SaveDataArchive.QueryFileEntryStorageSize(countFileEntry);
    var blockCountFileEntry = Math.floor((sizeFileEntry + sizeBlock - 1) / sizeBlock);
    return sizeBlock * (blockCountDirectoryEntry + blockCountFileEntry + countDataBlock);
*/
    return sizeBlock * countDataBlock;
};

/*---------------------------------------------------------------------------*/

SaveDataArchive.QueryMetaSize = function(
                                    countDirectoryEntry,
                                    countFileEntry,
                                    countDirectoryBucket,
                                    countFileBucket,
                                    sizeBlock,
                                    countDataBlock
                                )
{
    var sizeFixed =
        SaveDataArchive.QueryHeaderSize() +
        SaveDataArchive.QueryFileSystemControlAreaSize() +
        SaveDataArchive.QueryDirectoryEntryBucketStorageSize(countDirectoryBucket) +
        SaveDataArchive.QueryFileEntryBucketStorageSize(countFileBucket) +
        SaveDataArchive.QueryAllocationTableStorageSize(countDataBlock) +
        SaveDataArchive.QueryDirectoryEntryStorageSize(countDirectoryEntry) +
        SaveDataArchive.QueryFileEntryStorageSize(countFileEntry);
    return AdjustAlignment(sizeFixed, sizeBlock);
};

/*---------------------------------------------------------------------------*/

SaveDataArchive.QueryTotalSize = function(
                                     countDirectoryEntry,
                                     countFileEntry,
                                     countDirectoryBucket,
                                     countFileBucket,
                                     sizeBlock,
                                     countDataBlock
                                 )
{
    var sizeDirectoryEntry = SaveDataArchive.QueryDirectoryEntryStorageSize(countDirectoryEntry);
    var blockCountDirectoryEntry = Math.floor((sizeDirectoryEntry + sizeBlock - 1) / sizeBlock);
    var sizeFileEntry = SaveDataArchive.QueryFileEntryStorageSize(countFileEntry);
    var blockCountFileEntry = Math.floor((sizeFileEntry + sizeBlock - 1) / sizeBlock);
    var sizeFixed =
        SaveDataArchive.QueryHeaderSize() +
        SaveDataArchive.QueryFileSystemControlAreaSize() +
        SaveDataArchive.QueryDirectoryEntryBucketStorageSize(countDirectoryBucket) +
        SaveDataArchive.QueryFileEntryBucketStorageSize(countFileBucket) +
        SaveDataArchive.QueryAllocationTableStorageSize(blockCountDirectoryEntry + blockCountFileEntry + countDataBlock);
    sizeFixed = AdjustAlignment(sizeFixed, sizeBlock);
    return sizeFixed + sizeBlock * (blockCountDirectoryEntry + blockCountFileEntry + countDataBlock);
};

/*===========================================================================*/
/*!
    @brief Duplicated + integrity verification save data archive class.
    @ref DuplicatedIntegritySaveDataArchive.
*/
function DuplicatedIntegritySaveDataArchive()
{
};

/*---------------------------------------------------------------------------*/

DuplicatedIntegritySaveDataArchive.DUPLICATE_FULL      = 0x0001;    //!< Full duplexing.
DuplicatedIntegritySaveDataArchive.DUPLICATE_ONLY_META = 0x0002;    //!< Half duplexing.

DuplicatedIntegritySaveDataArchive.ATOMIC_HEADER_SIZE = 512;

/*---------------------------------------------------------------------------*/

DuplicatedIntegritySaveDataArchive.QueryOptimalBucketCount = function(countEntries)
{
    return SaveDataArchive.QueryOptimalBucketCount(countEntries);
};

/*---------------------------------------------------------------------------*/

DuplicatedIntegritySaveDataArchive.QuerySizeAsFullDuplication = function(
                                                                    inputParamDuplex,
                                                                    inputParamIntegrity,
                                                                    sizeArchiveBlock,
                                                                    countDirectoryEntry,
                                                                    countFileEntry,
                                                                    countDirectoryEntryBucket,
                                                                    countFileEntryBucket,
                                                                    countDataBlock
                                                                )
{
    var sizeArchive = SaveDataArchive.QueryTotalSize(
                                          countDirectoryEntry,
                                          countFileEntry,
                                          countDirectoryEntryBucket,
                                          countFileEntryBucket,
                                          sizeArchiveBlock,
                                          countDataBlock
                                      );

    // Gets the size of the management region for duplicated files with integrity verification.
    var resultDupInt = new DuplicatedIntegrityFile.QuerySizeResult();
    DuplicatedIntegrityFile.QuerySize(
                                resultDupInt,
                                inputParamDuplex,
                                inputParamIntegrity,
                                sizeArchive,
                                false
                            );

    // Calculates the maximum value for the block size.
    var sizeBlock =((inputParamDuplex.sizeBlockLevel[0] - 1)|
                    (inputParamDuplex.sizeBlockLevel[1] - 1)|
                    (inputParamIntegrity.sizeBlockLevel[0] - 1)|
                    (inputParamIntegrity.sizeBlockLevel[1] - 1)|
                    (inputParamIntegrity.sizeBlockLevel[2] - 1)|
                    (inputParamIntegrity.sizeBlockLevel[3] - 1)) + 1;

    // Calculates the size for the replicated placement.
    var offsetControlAreaA = DuplicatedIntegritySaveDataArchive.ATOMIC_HEADER_SIZE;
    var sizeControlAreaAB = resultDupInt.sizeControlArea;

    var offset = offsetControlAreaA;
    offset += sizeControlAreaAB;
    offset = AdjustAlignment(offset, 8/*sizeof(s64)*/);
    offset += sizeControlAreaAB;

    // Places the data portion after the management region for the duplexing file that has verification features.
    // Inserts padding to match the maximum block size.
    offset = AdjustAlignment(offset, sizeBlock);
    offset += resultDupInt.sizeTotalBody;

    // Returns the total data size.
    return offset;
};

/*---------------------------------------------------------------------------*/

DuplicatedIntegritySaveDataArchive.QuerySizeAsMetaDuplication = function(
                                                                    inputParamDuplex,
                                                                    inputParamIntegrity,
                                                                    sizeArchiveBlock,
                                                                    countDirectoryEntry,
                                                                    countFileEntry,
                                                                    countDirectoryEntryBucket,
                                                                    countFileEntryBucket,
                                                                    countDataBlock
                                                                )
{
    // Requests the size of the actual data.
    var sizeData = SaveDataArchive.QueryMinDataSize(
                                       countDirectoryEntry,
                                       countFileEntry,
                                       countDirectoryEntryBucket,
                                       countFileEntryBucket,
                                       sizeArchiveBlock,
                                       countDataBlock
                                   );

    // Requests the size of the metadata.
    var sizeMeta = SaveDataArchive.QueryMetaSize(
                                       countDirectoryEntry,
                                       countFileEntry,
                                       countDirectoryEntryBucket,
                                       countFileEntryBucket,
                                       sizeArchiveBlock,
                                       Math.floor(sizeData / sizeArchiveBlock)
                                   );

    // Gets the size of the management region for the duplexing file, by using the verification feature for the metadata.
    var resultDupInt1 = new DuplicatedIntegrityFile.QuerySizeResult();
    DuplicatedIntegrityFile.QuerySize(
                                resultDupInt1,
                                inputParamDuplex,
                                inputParamIntegrity,
                                sizeMeta,
                                false
                            );

    // Gets the size of the management region for the duplexing file, by using the verification feature for the actual data region.
    // Duplexes only the signature in the actual data region.
    var resultDupInt2 = new DuplicatedIntegrityFile.QuerySizeResult();
    // Copies the completeness verification parameter. (Additional information size is fixed to 0.)
    var inputParamIntegrity2 = new HierarchicalIntegrityVerificationFile.InputParam();
    inputParamIntegrity2 = inputParamIntegrity;
    inputParamIntegrity2.sizeOptionalInfo = 0;

    DuplicatedIntegrityFile.QuerySize(
                                resultDupInt2,
                                inputParamDuplex,
                                inputParamIntegrity2,
                                sizeData,
                                true
                            );

    // Calculates the maximum value for the block size.
    var sizeBlock =((inputParamDuplex.sizeBlockLevel[0] - 1)|
                    (inputParamDuplex.sizeBlockLevel[1] - 1)|
                    (inputParamIntegrity.sizeBlockLevel[0] - 1)|
                    (inputParamIntegrity.sizeBlockLevel[1] - 1)|
                    (inputParamIntegrity.sizeBlockLevel[2] - 1)|
                    (inputParamIntegrity.sizeBlockLevel[3] - 1)) + 1;

    // Calculates the size for the replicated placement.
    var offsetDuplicatedIntegrityControlArea1 = DuplicatedIntegritySaveDataArchive.ATOMIC_HEADER_SIZE;
    var offsetDuplicatedIntegrityControlArea2 =
        AdjustAlignment(resultDupInt1.sizeControlArea, 8/*sizeof(s64)*/);
    var sizeControlAreaAB = 
        offsetDuplicatedIntegrityControlArea2 +
        AdjustAlignment(resultDupInt2.sizeControlArea, 8/*sizeof(s64)*/);

    var offset = offsetDuplicatedIntegrityControlArea1;
    offset += sizeControlAreaAB;
    offset += sizeControlAreaAB;

    // Places the metadata region after the management region (actual data) for the duplexing file that has verification features.
    // Inserts padding to match the maximum block size.
    offset = AdjustAlignment(offset, sizeBlock);
    offset += resultDupInt1.sizeTotalBody;

    // Places the actual data region after the metadata region.
    offset = AdjustAlignment(offset, sizeBlock);
    offset += resultDupInt2.sizeTotalBody;

    // Returns the total data size.
    return offset;
};

/*---------------------------------------------------------------------------*/

DuplicatedIntegritySaveDataArchive.QuerySize = function(
                                                   inputParamDuplex,
                                                   inputParamIntegrity,
                                                   sizeArchiveBlock,
                                                   countDirectoryEntry,
                                                   countFileEntry,
                                                   countDirectoryEntryBucket,
                                                   countFileEntryBucket,
                                                   countDataBlock,
                                                   option
                                               )
{
    var sizeTotal = 0;

    if (option & DuplicatedIntegritySaveDataArchive.DUPLICATE_ONLY_META)
    {
        sizeTotal = DuplicatedIntegritySaveDataArchive.QuerySizeAsMetaDuplication(
                        inputParamDuplex,
                        inputParamIntegrity,
                        sizeArchiveBlock,
                        countDirectoryEntry,
                        countFileEntry,
                        countDirectoryEntryBucket,
                        countFileEntryBucket,
                        countDataBlock
                    );
    }
    else if (option & DuplicatedIntegritySaveDataArchive.DUPLICATE_FULL)
    {
        sizeTotal = DuplicatedIntegritySaveDataArchive.QuerySizeAsFullDuplication(
                        inputParamDuplex,
                        inputParamIntegrity,
                        sizeArchiveBlock,
                        countDirectoryEntry,
                        countFileEntry,
                        countDirectoryEntryBucket,
                        countFileEntryBucket,
                        countDataBlock
                    );
    }
    else
    {
        throw new ResultInvalidArgument();
    }

    return sizeTotal;
};

/*===========================================================================*/
/*!
    @brief Extended save data filter archive class.
    @ref ExtSaveDataFilterArchive.
*/
function ExtSaveDataFilterArchive()
{
};

/*---------------------------------------------------------------------------*/

ExtSaveDataFilterArchive.QueryFilteredFileSizeInternal = function(
                             sizeOriginalData,
                             isMetaFile
                         )
{
    // Duplexing parameter.
    var inputParamDuplex = new HierarchicalDuplexFile.InputParam();

    inputParamDuplex.sizeBlockLevel[0] = 128;
    inputParamDuplex.sizeBlockLevel[1] = 4096;

    // Integrity verification parameters.
    var inputParamIntegrity = new HierarchicalIntegrityVerificationFile.InputParam();

    inputParamIntegrity.sizeBlockLevel[0] = 512;
    inputParamIntegrity.sizeBlockLevel[1] = 512;
    inputParamIntegrity.sizeBlockLevel[2] = 4096;
    inputParamIntegrity.sizeBlockLevel[3] = 4096;
    inputParamIntegrity.sizeOptionalInfo = 0;

    // Requests the size of the filter file for duplexing and completeness verification.
    var resultDupIntFilter = new DuplicatedIntegrityFilterFile.QuerySizeResult();

    DuplicatedIntegrityFilterFile.QuerySize(
                                      resultDupIntFilter,
                                      inputParamDuplex,
                                      inputParamIntegrity,
                                      sizeOriginalData,
                                      !isMetaFile // Duplicates all of the metafiles only.
                                  );

    return resultDupIntFilter.sizeTotalBody;
};

/*---------------------------------------------------------------------------*/

ExtSaveDataFilterArchive.QueryFilteredMetaFileSize = function(
                             sizeMetaData
                         )
{
    return ExtSaveDataFilterArchive.QueryFilteredFileSizeInternal(
                                        sizeMetaData,
                                        true
                                    );
};

/*---------------------------------------------------------------------------*/

ExtSaveDataFilterArchive.QueryFilteredFileSize = function(
                             sizeOriginalData
                         )
{
    return ExtSaveDataFilterArchive.QueryFilteredFileSizeInternal(
                                        sizeOriginalData,
                                        false
                                    );
};

/*===========================================================================*/
/*!
    @brief Extended save data storage archive class.
    @ref ExtSaveDataStorageArchive.
*/
function ExtSaveDataStorageArchive()
{
};

/*---------------------------------------------------------------------------*/

ExtSaveDataStorageArchive.ENTRY_SIZE = 32;

/*---------------------------------------------------------------------------*/

ExtSaveDataStorageArchive.QueryMaxDirectoryEntryCount = function(
                              sizeArchiveBlock,
                              sizeEntry
                          )
{
    // Divides into two parts because of "." , "..".
    return Math.floor(sizeArchiveBlock / sizeEntry) - 2;
}

/*===========================================================================*/
/*!
    @brief Extended save data management class.
    @ref ExtSaveDataManager.
*/
function ExtSaveDataManager()
{
};

/*---------------------------------------------------------------------------*/

ExtSaveDataManager.QueryMetaDataSize = function(
                                            sizeArchiveBlock,
                                            countDirectoryEntry,
                                            countFileEntry
                                       )
{
    var countDirectoryBucket = WStringOnBit64PathStorageArchive.QueryOptimalBucketCount(countDirectoryEntry);
    var countFileBucket = WStringOnBit64PathStorageArchive.QueryOptimalBucketCount(countFileEntry);
    return WStringOnBit64PathStorageArchive.QueryTotalSize(
                                                countDirectoryEntry,
                                                countDirectoryBucket,
                                                countFileEntry,
                                                countFileBucket,
                                                sizeArchiveBlock
                                            );
};

/*---------------------------------------------------------------------------*/

ExtSaveDataManager.QueryTotalQuotaSize = function(
                                            sizeArchiveBlock,
                                            countDirectoryEntry,
                                            countFileEntry,
                                            sizeIcon,
                                            fileSizeArray,
                                            fileSizeArrayLength
                                         )
{
    countDirectoryEntry += 2; //  Added directories for <tt>user</tt> and <tt>boss</tt>.
    countFileEntry += 1;      //  Add icon file TO DO:. Remove for shared and expanded save data?
    var sizeMetaData = ExtSaveDataManager.QueryMetaDataSize(
                                              sizeArchiveBlock,
                                              countDirectoryEntry,
                                              countFileEntry
                                          );
    var resultDupIntFilter = new DuplicatedIntegrityFilterFile.QuerySizeResult();
    var sizeFilteredMetaData = ExtSaveDataFilterArchive.QueryFilteredMetaFileSize(sizeMetaData);
    var filteredMetaDataBlocks = Math.floor((sizeFilteredMetaData + sizeArchiveBlock - 1) / sizeArchiveBlock);

    var fileBlocks = 0;
    for (var i = 0; i < fileSizeArrayLength; i++)
    {
        var sizeFilteredFile = ExtSaveDataFilterArchive.QueryFilteredFileSize(fileSizeArray[i]);
        fileBlocks += Math.floor((sizeFilteredFile + sizeArchiveBlock - 1) / sizeArchiveBlock);
    }

    //  Number of files that can fit in a single directory.
    var countMaxEntryPerDirectory = ExtSaveDataStorageArchive.QueryMaxDirectoryEntryCount(
                                                                  sizeArchiveBlock,
                                                                  ExtSaveDataStorageArchive.ENTRY_SIZE
                                                              ); 

    //  Number of directories that are created when the maximum number of files (equal to <span class="argument">countFileEntry</span>) are created.
    var countMaxDirEntries = Math.floor((countFileEntry + countMaxEntryPerDirectory - 1) / countMaxEntryPerDirectory);
    if (countMaxDirEntries == 0)
    {
        countMaxDirEntries = 1;
    }
    //  Number of blocks required by root.
    var rootEntryBlocks = Math.floor((countMaxDirEntries + countMaxEntryPerDirectory - 1) / countMaxEntryPerDirectory);

    // Numer of directories that store files, including metafiles and icon files.
    var countDirEntries = Math.floor(((fileSizeArrayLength + 2) + countMaxEntryPerDirectory - 1) / countMaxEntryPerDirectory);

    var iconBlocks = 0;
    {
        var sizeFilterdIcon = ExtSaveDataFilterArchive.QueryFilteredFileSize(sizeIcon);
        iconBlocks = Math.floor((sizeFilterdIcon + sizeArchiveBlock - 1) / sizeArchiveBlock);
    }

    return (filteredMetaDataBlocks
          + fileBlocks
          + countDirEntries
          + rootEntryBlocks
          + iconBlocks) * sizeArchiveBlock;
};

/*===========================================================================*/
function ClearDebugPrint()
{
    if (!document.FsDebug) return;

    var out = document.FsDebug.output;
    if (!out) return;
    out.value = "";
};

/*---------------------------------------------------------------------------*/

function DebugPrint(str)
{
    if (!document.FsDebug) return;

    var out = document.FsDebug.output;
    if (!out) return;
    out.value += str + "\n";
};

/*===========================================================================*/

CalcFsSpaceResult = function()
{
    this.sizeTotal = 0;
    this.countDataBlock = 0;
};

/*---------------------------------------------------------------------------*/

function calcFsSpaceInternal(
             outResult,
             countDirectoryEntry,
             countFileEntry,
             sizeArchiveBlock,
             sizeCapacity,
             option
         )
{
    // Number of directory or file buckets.
    var countDirectoryEntryBucket = DuplicatedIntegritySaveDataArchive
                                        .QueryOptimalBucketCount(countDirectoryEntry);
    var countFileEntryBucket = DuplicatedIntegritySaveDataArchive
                                        .QueryOptimalBucketCount(countFileEntry);

    // Duplexing parameter.
    var inputParamDuplex = new HierarchicalDuplexFile.InputParam();

    inputParamDuplex.sizeBlockLevel[0] = 128;
    inputParamDuplex.sizeBlockLevel[1] = 512 * 8;

    // Integrity verification parameters.
    var inputParamIntegrity = new HierarchicalIntegrityVerificationFile.InputParam();

    // Changes according to the duplexing type and block size.
    switch (sizeArchiveBlock)
    {
    case 512:
        if (option & DuplicatedIntegritySaveDataArchive.DUPLICATE_ONLY_META)
        {
            inputParamIntegrity.sizeBlockLevel[0] = 512;
            inputParamIntegrity.sizeBlockLevel[1] = 512;
            inputParamIntegrity.sizeBlockLevel[2] = 512 * 8;
            inputParamIntegrity.sizeBlockLevel[3] = 512;
            inputParamIntegrity.sizeOptionalInfo = 0;
        }
        else if (option & DuplicatedIntegritySaveDataArchive.DUPLICATE_FULL)
        {
            inputParamIntegrity.sizeBlockLevel[0] = 512;
            inputParamIntegrity.sizeBlockLevel[1] = 512;
            inputParamIntegrity.sizeBlockLevel[2] = 512 * 8;
            inputParamIntegrity.sizeBlockLevel[3] = 512 * 8;
            inputParamIntegrity.sizeOptionalInfo = 0;
        }
        else
        {
            throw new ResultInvalidArgument();
        }
        break;
    case 4096:
        {
            inputParamIntegrity.sizeBlockLevel[0] = 512;
            inputParamIntegrity.sizeBlockLevel[1] = 512;
            inputParamIntegrity.sizeBlockLevel[2] = 512 * 8;
            inputParamIntegrity.sizeBlockLevel[3] = 512 * 8;
            inputParamIntegrity.sizeOptionalInfo = 0;
        }
        break;
    default:
        throw new ResultInvalidArgument();
        break;
    }

    // Total size.
    var sizeTotal = 0;

    // Adjusts the total number of blocks to match the capacity.
    var countDataBlockMin = 0;
    var countDataBlockMax = Math.floor(sizeCapacity / sizeArchiveBlock);
    var retryCount = 32;

    while (1 <= (countDataBlockMax - countDataBlockMin) && (0 < retryCount--))
    {
        var countDataBlock = Math.floor((countDataBlockMin + countDataBlockMax) / 2);

        sizeTotal = DuplicatedIntegritySaveDataArchive.QuerySize(
                                                           inputParamDuplex,
                                                           inputParamIntegrity,
                                                           sizeArchiveBlock,
                                                           countDirectoryEntry,
                                                           countFileEntry,
                                                           countDirectoryEntryBucket,
                                                           countFileEntryBucket,
                                                           countDataBlock,
                                                           option
                                                       );

        DebugPrint("sizeCapacity = " + sizeCapacity
                 + ", sizeTotal = " + sizeTotal
                 + ", countDataBlockMax = " + countDataBlockMax
                 + ", countDataBlockMin = " + countDataBlockMin);

        if (sizeTotal > sizeCapacity)
        {
            countDataBlockMax = countDataBlock;
        }
        else
        {
            countDataBlockMin = countDataBlock;
        }

        // Determine whether to leave partway. (No changes occur even if you continue.)
        if ((countDataBlockMax - countDataBlockMin) <= 1
         && (countDataBlock == countDataBlockMin))
        {
            break;
        }
    }

    // Calculates the number of blocks.
    outResult.countDataBlock = countDataBlockMin;

    // Calculates the final size.
    sizeTotal = DuplicatedIntegritySaveDataArchive.QuerySize(
                                                       inputParamDuplex,
                                                       inputParamIntegrity,
                                                       sizeArchiveBlock,
                                                       countDirectoryEntry,
                                                       countFileEntry,
                                                       countDirectoryEntryBucket,
                                                       countFileEntryBucket,
                                                       countDataBlock,
                                                       option
                                                   );
    if (sizeTotal <= sizeCapacity)
    {
        outResult.sizeTotal = sizeTotal;
    }
    else
    {
        outResult.sizeTotal = sizeTotal;
    }
};

/*---------------------------------------------------------------------------*/

var capacityUnit;
var type2BlockSize;

function calcFsSpace()
{
    // Clear debug output.
    ClearDebugPrint();

    if (!document.FsSpace) return;

    var FsSpace = document.FsSpace;

    if (FsSpace.fsblocksize[0].checked)
    {
        if (FsSpace.capacitytype[2].checked)
        {
            FsSpace.capacitytype[0].checked = true;
        }

        FsSpace.capacitytype[0].disabled = false;
        FsSpace.capacitytype[0].readonly = true;

        FsSpace.capacitytype[1].disabled = false;
        FsSpace.capacitytype[1].readonly = true;

        FsSpace.capacitytype[2].disabled = true;
        FsSpace.capacitytype[2].readonly = false;
    }
    else
    {
        FsSpace.capacitytype[2].checked = true;

        FsSpace.capacitytype[0].disabled = true;
        FsSpace.capacitytype[0].readonly = false;

        FsSpace.capacitytype[1].disabled = true;
        FsSpace.capacitytype[1].readonly = false;

        FsSpace.capacitytype[2].disabled = false;
        FsSpace.capacitytype[2].readonly = true;
    }

    if (FsSpace.capacitytype[2].checked)
    {
        FsSpace.capacitytypeuser.disabled = false;
        FsSpace.capacitytypeuser.readonly = true;
    }
    else
    {
        FsSpace.capacitytypeuser.readonly = false;
        FsSpace.capacitytypeuser.disabled = true;
    }

    // Full duplex or half duplex.
    var option = 0;
    if (FsSpace.fstype[0].checked)
    {
        option |= DuplicatedIntegritySaveDataArchive.DUPLICATE_ONLY_META;
    }
    else if (FsSpace.fstype[1].checked)
    {
        option |= DuplicatedIntegritySaveDataArchive.DUPLICATE_FULL;
    }

    // Block size.
    var sizeArchiveBlock = 512;
    if (FsSpace.fsblocksize[1].checked)
    {
        sizeArchiveBlock = type2BlockSize;
    }

    // Maximum number of directories or files.
    var countDirectoryEntry = parseInt(FsSpace.CountDirectoryEntry.value);
    var countFileEntry = parseInt(FsSpace.CountFileEntry.value);

    // Entry correction.
    if (isNaN(countDirectoryEntry) || countDirectoryEntry < 0)
    {
        countDirectoryEntry = 0;
    }
    if (isNaN(countFileEntry) || countFileEntry < 1)
    {
        countFileEntry = 1;
    }

    // Writes and returns the correction result.
    FsSpace.CountDirectoryEntry.value = countDirectoryEntry;
    FsSpace.CountFileEntry.value = countFileEntry;

    // Total capacity.
    var sizeCapacity = parseInt(FsSpace.capacitytypeuser.value) * capacityUnit;

    // Entry correction.
    if (isNaN(sizeCapacity) || sizeCapacity < 1 * capacityUnit)
    {
        sizeCapacity = 1 * capacityUnit;
    } else if (sizeCapacity > 2047 * capacityUnit && capacityUnit == 1024 * 1024) 
    {
        // Upper-limit correction is performed only during card2.
        sizeCapacity = 2047 * capacityUnit;
    }

    // Writes and returns the correction result.
    FsSpace.capacitytypeuser.value = Math.floor(sizeCapacity / capacityUnit);

    if (FsSpace.capacitytype[0].checked)
    {
        sizeCapacity = 120 * 1024;
    }
    else if (FsSpace.capacitytype[1].checked)
    {
        sizeCapacity = 504 * 1024;
    }

    // Calculates the size of the save data based on the obtained parameters.
    var result = new CalcFsSpaceResult();

    calcFsSpaceInternal(
         result,
         countDirectoryEntry,
         countFileEntry,
         sizeArchiveBlock,
         sizeCapacity,
         option
     )

    var sizeTotal = result.sizeTotal;
    var countDataBlock = result.countDataBlock;

    FsSpace.SaveDataBlockSize.value = sizeArchiveBlock;
    FsSpace.SaveDataCapacities.value = countDataBlock * sizeArchiveBlock;
    FsSpace.SaveDataBlocks.value = countDataBlock;
    FsSpace.SaveDataCapacitiesKilloByte.value = Math.floor(countDataBlock * sizeArchiveBlock / 1024);
};

/*---------------------------------------------------------------------------*/

function calcFsSpaceExtMeta()
{
    // Clears the debug output.
    ClearDebugPrint();

    if (!document.FsSpaceExtEntry) return;

    var FsSpace = document.FsSpaceExtEntry;

    // Full duplex or half duplex.
    var option = DuplicatedIntegritySaveDataArchive.DUPLICATE_ONLY_META;

    // Block size.
    var sizeArchiveBlock = 4096;

    // Icon size.
    var sizeIcon = parseInt(FsSpace.IconSize.value);

    // Entry correction.
    if (isNaN(sizeIcon) || sizeIcon <= 0)
    {
        sizeIcon = 1;
    }

    // Writes and returns the correction result.
    FsSpace.IconSize.value = sizeIcon;

    // Maximum number of directories or files.
    var countDirectoryEntry = parseInt(FsSpace.CountDirectoryEntry.value);
    var countFileEntry = parseInt(FsSpace.CountFileEntry.value);

    // Entry correction.
    if (isNaN(countDirectoryEntry) || countDirectoryEntry < 0)
    {
        countDirectoryEntry = 0;
    }
    if (isNaN(countFileEntry) || countFileEntry < 1)
    {
        countFileEntry = 1;
    }

    // Writes and returns the correction result.
    FsSpace.CountDirectoryEntry.value = countDirectoryEntry;
    FsSpace.CountFileEntry.value = countFileEntry;

    // Empties the file list.
    var arrayFileSize = [];

    // Calculates the size of the save data based on the obtained parameters.
    var sizeTotal = ExtSaveDataManager.QueryTotalQuotaSize(
                                           sizeArchiveBlock,
                                           countDirectoryEntry,
                                           countFileEntry,
                                           sizeIcon,
                                           arrayFileSize,
                                           0);
    var countDataBlock = Math.floor((sizeTotal + sizeArchiveBlock - 1) / sizeArchiveBlock);

    FsSpace.ExtSaveDataBlocks.value = countDataBlock;
    FsSpace.ExtSaveDataCapacities.value = sizeTotal;
    FsSpace.ExtSaveDataCapacitiesKilloByte.value = Math.floor(sizeTotal / 1024);
};

/*---------------------------------------------------------------------------*/

function calcFsSpaceExtFile()
{
    // Clears the debug output.
    ClearDebugPrint();

    if (!document.FsSpaceExtFile) return;

    var FsSpace = document.FsSpaceExtFile;

    // Full duplex or half duplex.
    var option = DuplicatedIntegritySaveDataArchive.DUPLICATE_ONLY_META;

    // Block size.
    var sizeArchiveBlock = 4096;

    // Total capacity.
    var sizeCapacity = parseInt(FsSpace.capacitytypeuser.value) * 1024;

    // Entry correction.
    if (isNaN(sizeCapacity) || sizeCapacity < 0)
    {
        sizeCapacity = 0;
    }

    // Writes and returns the correction result.
    FsSpace.capacitytypeuser.value = Math.floor(sizeCapacity / 1024);

    // Calculates the size of the save data based on the obtained parameters.
    var sizeTotal = ExtSaveDataFilterArchive.QueryFilteredFileSize(sizeCapacity);
    var countDataBlock = Math.floor((sizeTotal + sizeArchiveBlock - 1) / sizeArchiveBlock);

    // Every 124 + 126 * n, a directory is created, so that the maximum number that can be consumed is displayed.
    countDataBlock += 1;
    sizeTotal = countDataBlock * sizeArchiveBlock;

    FsSpace.ExtSaveDataBlocks.value = countDataBlock;
    FsSpace.ExtSaveDataCapacities.value = sizeTotal;
    FsSpace.ExtSaveDataCapacitiesKilloByte.value = Math.floor(sizeTotal / 1024);
};
