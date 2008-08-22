/*
 * create DOMLike Object on AppJet
 * ALREADY DONE
 *   IDのINDEXの実装 => もともとのDOM同様getElementByIdが一番速いと思う
 * TODO
 *   innerHTML相当機能の実装 => これがないと何のためにAppJetでDOM解析するのかわかんない
 *   getElementsByClassNameとか => これはそんなに入らない気もする
 *   XPathとか => たぶん衝撃的な難しさ
 *   その他いろいろ
 */


var DOM = function(){
  this.IDINDEX = {};
}

DOM.prototype._addIDIndex = function(id, elem){
  this.IDINDEX[id] = elem;
}

DOM.prototype.removeIDIndex = function(id){
  delete this.IDINDEX[id]
}

DOM.prototype._getById = function(id){
  return this.IDINDEX[id] || null;
}

DOM._HTMLreg = /(?:<([\/]?)([^>\s\/]*)\s*([^>]*)>|[^<>]*)/g;
DOM._TagNamereg = /<\s*([^<>\s]+)/;
DOM._Attrreg = /([^>\s]+="[^>"]+")/g;
DOM._Removereg = /(?:<!--.*-->|\n)/g;
DOM._Trimreg = /"/g;
DOM._Checkreg = /(?:^\s+|\s+$)/g;

DOM.prototype.parseFromString = function(str){
  str = DOM._removeMiscs(str);
  var doc = new DOM.Document(this),
      context = doc,
      arr = str.match(DOM._HTMLreg);
  arr.forEach(function(e, index, arr){
    switch(DOM._isTag(e)){
      case 'textNode':
        e = DOM._checkText(e);
        if(e) context.appendChild(DOM.createTextNode(e, context, this));
        break;
      case 'single':
        context.appendChild(DOM.createElement(DOM._parseTag(e), context, this));
        break;
      case 'tag':
        context = context.appendChild(DOM.createElement(DOM._parseTag(e), context, this));
        break;
      case 'close':
        context = context.parentNode;
        break;
      default:
        break;
    }
  }, this);
  return doc;
}

DOM._removeMiscs = function(str){
  return str.replace(DOM._Removereg, "");
}


DOM._checkText = function(str){
  str = str.replace(DOM._Checkreg, "");
  return (str=="")? false : str;
}

DOM._isTag = function(str){
  if(str.indexOf('<') != 0)
    return 'textNode';
  else{
    switch(str.charAt(1)){
      case '/':
        return 'close';
        break;
      case '!':
      case '?':
        return 'ignore';
        break;
      default:
        if(str.indexOf('/>') > 0)
          return 'single';
        else return 'tag';
        break;
    }
  }
}

DOM._trim = function(str){
  return str.replace(DOM._Trimreg, '');
}

DOM._parseTag = function(str){
  var tagName = str.match(DOM._TagNamereg)[1];
  var arr = str.match(DOM._Attrreg);
  var ret = {tagName:tagName};
  if(arr!=null){
    arr.forEach(function(e){
        var a = e.split('=');
        ret[a[0]] = DOM._trim(a[1]);
    });
  }
  return ret;
}

DOM.Document = function(parser){
  this._getParser = function(){ return parser};
  this.nodeName = '#document';
  this.nodeType = 9;
  this.childNodes = [];
}

DOM.Document.prototype.getElementById = function(id){
  return this._getParser()._getById(id);
}

DOM.createElement = function(opt, context, parser){
  return new DOM.Element(opt, context, parser);
}

DOM.Element = function(params, context, parser){
  this._getParser = function(){ return parser};
  this.childNodes = [];
  this.parentNode = context;
  for(var i in params)
    this[i] = params[i];
  if('id' in params) parser._addIDIndex(params['id'], this);
}

DOM.createTextNode = function(opt, context, parser){
  return new DOM.TextNode(opt, context, parser);
}

DOM.TextNode = function(str, context, parser){
  this._getParser = function(){ return parser};
  this.childNodes = [];
  this.parentNode = context;
  this.value = str;
}

DOM.Functions = {
  getElementsByTagName: function(tagname){
    var ret = [];
    tagname = tagname.toUpperCase();
    var f = function(e){
      if(e.tagName && e.tagName.toUpperCase() == tagname) ret.push(e);
      e.childNodes.forEach(f);
    }
    this.childNodes.forEach(f);
    return ret;
  },

  appendChild: function(elem){
    this.childNodes.push(elem);
    return elem;
  },

  removeChild: function(elem){
    var i, ret;
    if(this.childNodes.some(function(e, index){
      if(e==elem){
        i = index;
        return true;
      }
      else return false;
    })){
      if(elem.id) this._getParser().removeIDIndex(elem.id);
      return this.childNodes.splice(i, 1);
    }
  }
}

DOM.execute = function(){
  for(var name in DOM.Functions){
    DOM.Document.prototype[name] = DOM.Functions[name];
    DOM.Element.prototype[name] = DOM.Functions[name];
    DOM.TextNode.prototype[name] = DOM.Functions[name];
  }
}

DOM.execute();
