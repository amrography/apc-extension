define(['exports', 'apc/auxiliary'], function (exports, auxiliary) {

  class DomListener {
    constructor(node, type, handler, options) {
      this._node = node;
      this._type = type;
      this._handler = handler;
      this._options = (options ?? false);
      this._node.addEventListener(this._type, this._handler, this._options);
    }

    dispose() {
      if (!this._handler) { return; }
      this._node.removeEventListener(this._type, this._handler, this._options);
      this._node = null;
      this._handler = null;
    }
  };

  try {
    const { store, findOwnProperty, traceError } = auxiliary;

    const [, DisposableStore] = findOwnProperty(require('vs/base/common/lifecycle'), 'DisposableStore', 'DISABLE_DISPOSED_WARNING');
    const [, Dimension] = findOwnProperty(require('vs/base/browser/dom'), 'Dimension', 'equals');

    store.Dimension = Dimension;

    const browser = require('vs/base/browser/browser');
    for (const key in browser) {
      if (browser[key] instanceof Function && browser[key].length === 1) {
        const original = browser[key];
        browser[key] = function (arg) {
          if (typeof arg === 'number') { store.zoomFactor = arg; }
          // if(typeof arg === 'boolean') {} fullscreen
          original(arg);
        };
      }
      // else if (browser[key] instanceof Object && 'onDidChange' in browser[key]) { store.PixelRatio = browser[key]; }
      // else if (browser[key] instanceof Function && browser[key].length === 3) { store.onDidChangeFullscreen = browser[key]; }
    }

    exports.config = {
      disposables: new DisposableStore(),
      addDisposable(disposable) {
        try {
          this.disposables.add(disposable);
          return disposable;
        } catch (error) { traceError(error); }
      },
      addDisposableListener(node, type, handler, options) {
        return this.addDisposable(new DomListener(node, type, handler, options));
      },
      getConfiguration(config) {
        try { return store.configurationService.getValue(config); }
        catch (error) { traceError(error); }
      },
      get zoomFactor() {
        try { return store.zoomFactor; }
        catch (error) {
          traceError(error);
          return 1;
        }
      },
      HEADER_HEIGHT: 37,
      HEADER_FONT_SIZE: 13,
      get header() {
        const { height, fontSize } = this.getConfiguration('apc.header') || {};
        const factor = this.zoomFactor;
        return {
          height: (height || this.HEADER_HEIGHT) * factor,
          fontSize: (fontSize || this.HEADER_FONT_SIZE) * factor,
          isEnabled: !!(fontSize || height)
        };
      },

      TITLEBAR_HEIGHT: 35,
      TITLEBAR_FONT_SIZE: 11,
      get titlebar() {
        const { height, fontSize } = this.getConfiguration('apc.sidebar.titlebar') || {};
        const factor = this.zoomFactor;
        return {
          height: (height || this.TITLEBAR_HEIGHT) * factor,
          fontSize: (fontSize || this.TITLEBAR_FONT_SIZE) * factor,
          isEnabled: !!(fontSize || height)
        };
      },

      LIST_ROW_HEIGHT: 22,
      LIST_ROW_FONT_SIZE: 13,
      get listRow() {
        const { height, fontSize } = this.getConfiguration('apc.listRow') || {};
        const factor = this.zoomFactor;
        return {
          height: (height || this.LIST_ROW_HEIGHT) * factor,
          fontSize: (fontSize || this.LIST_ROW_FONT_SIZE) * factor,
          isEnabled: !!(fontSize || height)
        };
      },

      ACTIVITY_BAR_SIZE: 48,
      get activityBar() {
        const { size, position, hideSettings } = this.getConfiguration('apc.activityBar') || {};
        const isHorizontal = !!position;
        return {
          position,
          hideSettings,
          isHorizontal,
          orientation: isHorizontal ? 0 : 1, // ?? action Orientation
          size: (size ?? this.ACTIVITY_BAR_SIZE) * this.zoomFactor,
          isEnabled: !!size
        };
      },

      STATUSBAR_HEIGHT: 22,
      STATUSBAR_FONT_SIZE: 12,
      get statusBar() {
        const { fontSize, height, position } = this.getConfiguration('apc.statusBar') || {};
        const factor = this.zoomFactor;
        return {
          position: position || 'bottom',
          height: (height ?? this.STATUSBAR_HEIGHT) * factor,
          fontSize: (fontSize ?? this.STATUSBAR_FONT_SIZE) * factor,
          isEnabled: !!(fontSize || height || position)
        };
      },

      // !! default value
      get electron() {
        if (!this._electronConfig) {
          this._electronConfig = this.getConfiguration('apc.electron') || {};
        }
        return this._electronConfig;
      },

      get titleBarStyle() {
        if (!this._titleBarStyle) {
          this._titleBarStyle = this.getConfiguration('window.titleBarStyle');
        }
        return this._titleBarStyle;
      },

      get isInline() {
        if (!this._isInline) {
          this._isInline = this.titleBarStyle === 'native' && (this.electron.titleBarStyle || this.electron.frame === false);
        }
        return this._isInline;
      },

      handleDblclick(element, onDblclick) {
        return this.addDisposableListener(element, 'dblclick', onDblclick);
      },

      handleTitleDoubleClick(...args) {
        try { return store.nativeHostService.handleTitleDoubleClick(...args); }
        catch (error) { traceError(error); }
      },

      onDidChangeConfiguration(...args) {
        try { return store.configurationService.onDidChangeConfiguration(...args); }
        catch (error) { traceError(error); }
      },

      getColor(config) {
        try { return store.themeService.getColorTheme().getColor(config)?.toString(); }
        catch (error) { traceError(error); }
      }

    };
  } catch (error) { traceError(error); }

});