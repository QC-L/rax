import tool from '../utils/tool';
import Node from '../node/node';

class TextNode extends Node {
  static $$create(options, tree) {
    return new TextNode(options, tree);
  }

  $$init(options, tree) {
    options.type = 'text';

    super.$$init(options, tree);

    this.$_content = options.content || '';
  }

  $$destroy() {
    super.$$destroy();

    this.$_content = '';
  }

  $$recycle() {
    this.$$destroy();
  }

  _triggerUpdate(payload) {
    this._root && this._root.enqueueRender(payload);
  }

  get $$domInfo() {
    return {
      nodeId: this.$_nodeId,
      pageId: this.__pageId,
      nodeType: this.$_type,
      content: this.$_content,
    };
  }

  get nodeName() {
    return '#text';
  }

  get nodeType() {
    return Node.TEXT_NODE;
  }

  get nodeValue() {
    return this.textContent;
  }

  set nodeValue(value) {
    this.textContent = value;
  }

  get textContent() {
    return this.$_content;
  }

  set textContent(value) {
    value += '';

    this.$_content = value;
    const payload = {
      path: `${this._path}.content`,
      value
    };
    this._triggerUpdate(payload);
  }

  get data() {
    return this.textContent;
  }

  set data(value) {
    this.textContent = value;
  }

  cloneNode() {
    return this.ownerDocument.$$createTextNode({
      content: this.$_content,
      nodeId: `b-${tool.getId()}`,
    });
  }
}

export default TextNode;
