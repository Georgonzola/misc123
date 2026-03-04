/*
 * Declaration of the "PrintPage" pseudo-namespace for guideline display processing.
 */
var PrintPage = function() {};

PrintPage.templateRootPath = "/" + TemplateSettings.documentRootPath;

// Copy IFRAME content.
PrintPage.copybody = function(dstId, srcId)
{
  var sobj = document.getElementById(srcId);
  var dobj = document.getElementById(dstId);
  if ((sobj == null) || (dobj == null)) return;
  var owin = sobj.contentWindow;
  if (owin == null) return;
  dobj.innerHTML = owin.document.body.innerHTML;
  owin.document.body.innerHTML = "";
  // Fix IMG and A tag reference targets.
  var imgObjs = dobj.getElementsByTagName("IMG");
  if (imgObjs.length)
  {
    for (var n = 0; n < imgObjs.length; n++)
    {
      var imgObj = imgObjs[n];
      if (imgObj.src.match(/\/Attachments\//)) imgObj.src = imgObj.src.replace(/\/Attachments\//, PrintPage.templateRootPath + "Attachments/");
    }
  }
  var anchorObjs = dobj.getElementsByTagName("A");
  if (anchorObjs.length)
  {
    for (var n = 0; n < anchorObjs.length; n++)
    {
      var anchorObj = anchorObjs[n];
      if (anchorObj.href.match(/\/Attachments\//)) anchorObj.href = anchorObj.href.replace(/\/Attachments\//, PrintPage.templateRootPath +"Attachments/");
      // Rewrite the "FlashMovie" link, but cannot play video.
      if (anchorObj.href.match(/\/player\.html/)) anchorObj.href = anchorObj.href.replace(/\/player\.html/, PrintPage.templateRootPath + "player.html");
      // Also rewrite the "viewPage" link, but this has no effect because "viewPage" cannot be used.
      if (anchorObj.href.match(/\/Heads\//)) anchorObj.href = anchorObj.href.replace(/\/Heads\//, PrintPage.templateRootPath + "Heads/");
      if (anchorObj.href.match(/\/Descs\//)) anchorObj.href = anchorObj.href.replace(/\/Descs\//, PrintPage.templateRootPath + "Descs/");
      if (anchorObj.href.match(/\/Items\//)) anchorObj.href = anchorObj.href.replace(/\/Items\//, PrintPage.templateRootPath + "Items/");
    }
  }
}

// Insert an invisible IFRAME and copy just the content.
PrintPage.insertIFRAME = function(dwin, data, mode)
{
  if ((dwin == null) || (dwin.document == null)) return;
  if (data == null) return;
  var srcName = "iwin_" + data.getExpandLabel();
  var srcId = "ifrm_" + data.getExpandLabel();
  var dstId = "view_" + data.getExpandLabel();

//  alert("srcId=" + srcId + " dstId=" + dstId + " url=" + data.getURL());

  var url = data.getURL() + "?level=" + data.getQuery() + "&figure=" + data.getFigureNo() + "&table=" + data.getTableNo() + "&code=" + data.getCodeNo() + "&mode=" + mode + "&noindex=yes";

  dwin.document.writeln("<div id=\"" + dstId + "\"></div>");
  dwin.document.writeln("<iframe name=\"" + srcName + "\" id=\"" + srcId + "\" src=\"" + url + "\" style=\"display: none;\" onLoad=\"PrintPage.copybody('" + dstId + "', '" + srcId + "');\"></iframe>");
}

// Generate a printable page.
PrintPage.createPrintPage = function(dwin, tocObj)
{
  if ((dwin == null) || (dwin.document == null)) return;
  if (tocObj == null) return;
  var dataCount = tocObj.getDataCount();
  if (dataCount <= 0) return;

  // Only support specifying single categories?
  var query = location.search;
  if (query.lastIndexOf("?") != -1) query = query.slice(query.lastIndexOf("?") + 1);

  var params = query.split("&");
  var category = "";
  var mode = "0";

  for (i = 0; i < params.length; i++)
  {
    var param = params[i];
    var ind = param.indexOf("=");
    if (ind < 0) continue;
    var key = param.substring(0, ind);
    key = decodeURIComponent(key);
    var data = param.slice(ind + 1);
    if (key.match(/^category$/i))
    {
      category = decodeURIComponent(data);
    }
    else if (key.match(/^mode$/i))
    {
      mode = decodeURIComponent(data);
    }
  }

  var nMode = parseInt(mode);
  if (isNaN(nMode)) nMode = 0;
  if ((nMode < 0) || (nMode > 2)) nMode = 0;

//  alert("category=" + category + " mode=" + nMode);

  // Get tree data.
  var prevURL = "";
  for (i = 0; i < dataCount; i++)
  {
    var dataObj = tocObj.getData(i);
    if (dataObj == null) continue;
    var dataCategory = dataObj.getCategory();
    if ((category == "*") || (category == "") || (category == dataCategory))
    {
      var currentURL = dataObj.getURL();
      if (currentURL == "") continue;
      if (currentURL != prevURL) PrintPage.insertIFRAME(dwin, dataObj, nMode);
      prevURL = dataObj.getURL();
    }
  }
}

