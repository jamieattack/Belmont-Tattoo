/**


*/

(function( window, $, undefined ){

  'use strict';

  // get global vars
  var document = window.document;
  var Modernizr = window.Modernizr;

  // helper function
  var capitalize = function( str ) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // ========================= getStyleProperty by kangax ===============================
  // http://perfectionkills.com/feature-testing-css-properties/

  var prefixes = 'Moz Webkit O Ms'.split(' ');

  var getStyleProperty = function( propName ) {
    var style = document.documentElement.style,
        prefixed;

    // test standard property first
    if ( typeof style[propName] === 'string' ) {
      return propName;
    }

    // capitalize
    propName = capitalize( propName );

    // test vendor specific properties
    for ( var i=0, len = prefixes.length; i < len; i++ ) {
      prefixed = prefixes[i] + propName;
      if ( typeof style[ prefixed ] === 'string' ) {
        return prefixed;
      }
    }
  };

  var transformProp = getStyleProperty('transform'),
      transitionProp = getStyleProperty('transitionProperty');


  // ========================= miniModernizr ===============================
  // <3<3<3 and thanks to Faruk and Paul for doing the heavy lifting

  /*!
   * Modernizr v1.6ish: miniModernizr for Isotope
   * http://www.modernizr.com
   *
   * Developed by:
   * - Faruk Ates  http://farukat.es/
   * - Paul Irish  http://paulirish.com/
   *
   * Copyright (c) 2009-2010
   * Dual-licensed under the BSD or MIT licenses.
   * http://www.modernizr.com/license/
   */

  /*
   * This version whittles down the script just to check support for
   * CSS transitions, transforms, and 3D transforms.
  */

  var tests = {
    csstransforms: function() {
      return !!transformProp;
    },

    csstransforms3d: function() {
      var test = !!getStyleProperty('perspective');
      // double check for Chrome's false positive
      if ( test ) {
        var vendorCSSPrefixes = ' -o- -moz- -ms- -webkit- -khtml- '.split(' '),
            mediaQuery = '@media (' + vendorCSSPrefixes.join('transform-3d),(') + 'modernizr)',
            $style = $('<style>' + mediaQuery + '{#modernizr{height:3px}}' + '</style>')
                        .appendTo('head'),
            $div = $('<div id="modernizr" />').appendTo('html');

        test = $div.height() === 3;

        $div.remove();
        $style.remove();
      }
      return test;
    },

    csstransitions: function() {
      return !!transitionProp;
    }
  };

  var testName;

  if ( Modernizr ) {
    // if there's a previous Modernzir, check if there are necessary tests
    for ( testName in tests) {
      if ( !Modernizr.hasOwnProperty( testName ) ) {
        // if test hasn't been run, use addTest to run it
        Modernizr.addTest( testName, tests[ testName ] );
      }
    }
  } else {
    // or create new mini Modernizr that just has the 3 tests
    Modernizr = window.Modernizr = {
      _version : '1.6ish: miniModernizr for Isotope'
    };

    var classes = ' ';
    var result;

    // Run through tests
    for ( testName in tests) {
      result = tests[ testName ]();
      Modernizr[ testName ] = result;
      classes += ' ' + ( result ?  '' : 'no-' ) + testName;
    }

    // Add the new classes to the <html> element.
    $('html').addClass( classes );
  }


  // ========================= isoTransform ===============================

  /**
   *  provides hooks for .css({ scale: value, translate: [x, y] })
   *  Progressively enhanced CSS transforms
   *  Uses hardware accelerated 3D transforms for Safari
   *  or falls back to 2D transforms.
   */

  if ( Modernizr.csstransforms ) {

        // i.e. transformFnNotations.scale(0.5) >> 'scale3d( 0.5, 0.5, 1)'
    var transformFnNotations = Modernizr.csstransforms3d ?
      { // 3D transform functions
        translate : function ( position ) {
          return 'translate3d(' + position[0] + 'px, ' + position[1] + 'px, 0) ';
        },
        scale : function ( scale ) {
          return 'scale3d(' + scale + ', ' + scale + ', 1) ';
        }
      } :
      { // 2D transform functions
        translate : function ( position ) {
          return 'translate(' + position[0] + 'px, ' + position[1] + 'px) ';
        },
        scale : function ( scale ) {
          return 'scale(' + scale + ') ';
        }
      }
    ;

    var setIsoTransform = function ( elem, name, value ) {
          // unpack current transform data
      var data =  $.data( elem, 'isoTransform' ) || {},
          newData = {},
          fnName,
          transformObj = {},
          transformValue;

      // i.e. newData.scale = 0.5
      newData[ name ] = value;
      // extend new value over current data
      $.extend( data, newData );

      for ( fnName in data ) {
        transformValue = data[ fnName ];
        transformObj[ fnName ] = transformFnNotations[ fnName ]( transformValue );
      }

      // get proper order
      // ideally, we could loop through this give an array, but since we only have
      // a couple transforms we're keeping track of, we'll do it like so
      var translateFn = transformObj.translate || '',
          scaleFn = transformObj.scale || '',
          // sorting so translate always comes first
          valueFns = translateFn + scaleFn;

      // set data back in elem
      $.data( elem, 'isoTransform', data );

      // set name to vendor specific property
      elem.style[ transformProp ] = valueFns;
    };

    // ==================== scale ===================

    $.cssNumber.scale = true;

    $.cssHooks.scale = {
      set: function( elem, value ) {
        // uncomment this bit if you want to properly parse strings
        // if ( typeof value === 'string' ) {
        //   value = parseFloat( value );
        // }
        setIsoTransform( elem, 'scale', value );
      },
      get: function( elem, computed ) {
        var transform = $.data( elem, 'isoTransform' );
        return transform && transform.scale ? transform.scale : 1;
      }
    };

    $.fx.step.scale = function( fx ) {
      $.cssHooks.scale.set( fx.elem, fx.now+fx.unit );
    };


    // ==================== translate ===================

    $.cssNumber.translate = true;

    $.cssHooks.translate = {
      set: function( elem, value ) {

        // uncomment this bit if you want to properly parse strings
        // if ( typeof value === 'string' ) {
        //   value = value.split(' ');
        // }
        //
        // var i, val;
        // for ( i = 0; i < 2; i++ ) {
        //   val = value[i];
        //   if ( typeof val === 'string' ) {
        //     val = parseInt( val );
        //   }
        // }

        setIsoTransform( elem, 'translate', value );
      },

      get: function( elem, computed ) {
        var transform = $.data( elem, 'isoTransform' );
        return transform && transform.translate ? transform.translate : [ 0, 0 ];
      }
    };

  }

  // ========================= get transition-end event ===============================
  var transitionEndEvent, transitionDurProp;

  if ( Modernizr.csstransitions ) {
    transitionEndEvent = {
      WebkitTransitionProperty: 'webkitTransitionEnd',  // webkit
      MozTransitionProperty: 'transitionend',
      OTransitionProperty: 'oTransitionEnd otransitionend',
      transitionProperty: 'transitionend'
    }[ transitionProp ];

    transitionDurProp = getStyleProperty('transitionDuration');
  }

  // ========================= smartresize ===============================

  /*
   * smartresize: debounced resize event for jQuery
   *
   * latest version and complete README available on Github:
   * https://github.com/louisremi/jquery.smartresize.js
   *
   * Copyright 2011 @louis_remi
   * Licensed under the MIT license.
   */

  var $event = $.event,
      dispatchMethod = $.event.handle ? 'handle' : 'dispatch',
      resizeTimeout;

  $event.special.smartresize = {
    setup: function() {
      $(this).bind( "resize", $event.special.smartresize.handler );
    },
    teardown: function() {
      $(this).unbind( "resize", $event.special.smartresize.handler );
    },
    handler: function( event, execAsap ) {
      // Save the context
      var context = this,
          args = arguments;

      // set correct event type
      event.type = "smartresize";

      if ( resizeTimeout ) { clearTimeout( resizeTimeout ); }
      resizeTimeout = setTimeout(function() {
        $event[ dispatchMethod ].apply( context, args );
      }, execAsap === "execAsap"? 0 : 100 );
    }
  };

  $.fn.smartresize = function( fn ) {
    return fn ? this.bind( "smartresize", fn ) : this.trigger( "smartresize", ["execAsap"] );
  };



// ========================= Isotope ===============================


  // our "Widget" object constructor
  $.Isotope = function( options, element, callback ){
    this.element = $( element );

    this._create( options );
    this._init( callback );
  };

  // styles of container element we want to keep track of
  var isoContainerStyles = [ 'width', 'height' ];

  var $window = $(window);

  $.Isotope.settings = {
    resizable: true,
    layoutMode : 'masonry',
    containerClass : 'isotope',
    itemClass : 'isotope-item',
    hiddenClass : 'isotope-hidden',
    hiddenStyle: { opacity: 0, scale: 0.001 },
    visibleStyle: { opacity: 1, scale: 1 },
    containerStyle: {
      position: 'relative',
      overflow: 'hidden'
    },
    animationEngine: 'best-available',
    animationOptions: {
      queue: false,
      duration: 800
    },
    sortBy : 'original-order',
    sortAscending : true,
    resizesContainer : true,
    transformsEnabled: true,
    itemPositionDataEnabled: false
  };

  $.Isotope.prototype = {

    // sets up widget
    _create : function( options ) {

      this.options = $.extend( {}, $.Isotope.settings, options );

      this.styleQueue = [];
      this.elemCount = 0;

      // get original styles in case we re-apply them in .destroy()
      var elemStyle = this.element[0].style;
      this.originalStyle = {};
      // keep track of container styles
      var containerStyles = isoContainerStyles.slice(0);
      for ( var prop in this.options.containerStyle ) {
        containerStyles.push( prop );
      }
      for ( var i=0, len = containerStyles.length; i < len; i++ ) {
        prop = containerStyles[i];
        this.originalStyle[ prop ] = elemStyle[ prop ] || '';
      }
      // apply container style from options
      this.element.css( this.options.containerStyle );

      this._updateAnimationEngine();
      this._updateUsingTransforms();

      // sorting
      var originalOrderSorter = {
        'original-order' : function( $elem, instance ) {
          instance.elemCount ++;
          return instance.elemCount;
        },
        random : function() {
          return Math.random();
        }
      };

      this.options.getSortData = $.extend( this.options.getSortData, originalOrderSorter );

      // need to get atoms
      this.reloadItems();

      // get top left position of where the bricks should be
      this.offset = {
        left: parseInt( ( this.element.css('padding-left') || 0 ), 10 ),
        top: parseInt( ( this.element.css('padding-top') || 0 ), 10 )
      };

      // add isotope class first time around
      var instance = this;
      setTimeout( function() {
        instance.element.addClass( instance.options.containerClass );
      }, 0 );

      // bind resize method
      if ( this.options.resizable ) {
        $window.bind( 'smartresize.isotope', function() {
          instance.resize();
        });
      }

      // dismiss all click events from hidden events
      this.element.delegate( '.' + this.options.hiddenClass, 'click', function(){
        return false;
      });

    },

    _getAtoms : function( $elems ) {
      var selector = this.options.itemSelector,
          // filter & find
          $atoms = selector ? $elems.filter( selector ).add( $elems.find( selector ) ) : $elems,
          // base style for atoms
          atomStyle = { position: 'absolute' };

      // filter out text nodes
      $atoms = $atoms.filter( function( i, atom ) {
        return atom.nodeType === 1;
      });

      if ( this.usingTransforms ) {
        atomStyle.left = 0;
        atomStyle.top = 0;
      }

      $atoms.css( atomStyle ).addClass( this.options.itemClass );

      this.updateSortData( $atoms, true );

      return $atoms;
    },

    // _init fires when your instance is first created
    // (from the constructor above), and when you
    // attempt to initialize the widget again (by the bridge)
    // after it has already been initialized.
    _init : function( callback ) {

      this.$filteredAtoms = this._filter( this.$allAtoms );
      this._sort();
      this.reLayout( callback );

    },

    option : function( opts ){
      // change options AFTER initialization:
      // signature: $('#foo').bar({ cool:false });
      if ( $.isPlainObject( opts ) ){
        this.options = $.extend( true, this.options, opts );

        // trigger _updateOptionName if it exists
        var updateOptionFn;
        for ( var optionName in opts ) {
          updateOptionFn = '_update' + capitalize( optionName );
          if ( this[ updateOptionFn ] ) {
            this[ updateOptionFn ]();
          }
        }
      }
    },

    // ====================== updaters ====================== //
    // kind of like setters

    _updateAnimationEngine : function() {
      var animationEngine = this.options.animationEngine.toLowerCase().replace( /[ _\-]/g, '');
      var isUsingJQueryAnimation;
      // set applyStyleFnName
      switch ( animationEngine ) {
        case 'css' :
        case 'none' :
          isUsingJQueryAnimation = false;
          break;
        case 'jquery' :
          isUsingJQueryAnimation = true;
          break;
        default : // best available
          isUsingJQueryAnimation = !Modernizr.csstransitions;
      }
      this.isUsingJQueryAnimation = isUsingJQueryAnimation;
      this._updateUsingTransforms();
    },

    _updateTransformsEnabled : function() {
      this._updateUsingTransforms();
    },

    _updateUsingTransforms : function() {
      var usingTransforms = this.usingTransforms = this.options.transformsEnabled &&
        Modernizr.csstransforms && Modernizr.csstransitions && !this.isUsingJQueryAnimation;

      // prevent scales when transforms are disabled
      if ( !usingTransforms ) {
        delete this.options.hiddenStyle.scale;
        delete this.options.visibleStyle.scale;
      }

      this.getPositionStyles = usingTransforms ? this._translate : this._positionAbs;
    },


    // ====================== Filtering ======================

    _filter : function( $atoms ) {
      var filter = this.options.filter === '' ? '*' : this.options.filter;

      if ( !filter ) {
        return $atoms;
      }

      var hiddenClass    = this.options.hiddenClass,
          hiddenSelector = '.' + hiddenClass,
          $hiddenAtoms   = $atoms.filter( hiddenSelector ),
          $atomsToShow   = $hiddenAtoms;

      if ( filter !== '*' ) {
        $atomsToShow = $hiddenAtoms.filter( filter );
        var $atomsToHide = $atoms.not( hiddenSelector ).not( filter ).addClass( hiddenClass );
        this.styleQueue.push({ $el: $atomsToHide, style: this.options.hiddenStyle });
      }

      this.styleQueue.push({ $el: $atomsToShow, style: this.options.visibleStyle });
      $atomsToShow.removeClass( hiddenClass );

      return $atoms.filter( filter );
    },

    // ====================== Sorting ======================

    updateSortData : function( $atoms, isIncrementingElemCount ) {
      var instance = this,
          getSortData = this.options.getSortData,
          $this, sortData;
      $atoms.each(function(){
        $this = $(this);
        sortData = {};
        // get value for sort data based on fn( $elem ) passed in
        for ( var key in getSortData ) {
          if ( !isIncrementingElemCount && key === 'original-order' ) {
            // keep original order original
            sortData[ key ] = $.data( this, 'isotope-sort-data' )[ key ];
          } else {
            sortData[ key ] = getSortData[ key ]( $this, instance );
          }
        }
        // apply sort data to element
        $.data( this, 'isotope-sort-data', sortData );
      });
    },

    // used on all the filtered atoms
    _sort : function() {

      var sortBy = this.options.sortBy,
          getSorter = this._getSorter,
          sortDir = this.options.sortAscending ? 1 : -1,
          sortFn = function( alpha, beta ) {
            var a = getSorter( alpha, sortBy ),
                b = getSorter( beta, sortBy );
            // fall back to original order if data matches
            if ( a === b && sortBy !== 'original-order') {
              a = getSorter( alpha, 'original-order' );
              b = getSorter( beta, 'original-order' );
            }
            return ( ( a > b ) ? 1 : ( a < b ) ? -1 : 0 ) * sortDir;
          };

      this.$filteredAtoms.sort( sortFn );
    },

    _getSorter : function( elem, sortBy ) {
      return $.data( elem, 'isotope-sort-data' )[ sortBy ];
    },

    // ====================== Layout Helpers ======================

    _translate : function( x, y ) {
      return { translate : [ x, y ] };
    },

    _positionAbs : function( x, y ) {
      return { left: x, top: y };
    },

    _pushPosition : function( $elem, x, y ) {
      x = Math.round( x + this.offset.left );
      y = Math.round( y + this.offset.top );
      var position = this.getPositionStyles( x, y );
      this.styleQueue.push({ $el: $elem, style: position });
      if ( this.options.itemPositionDataEnabled ) {
        $elem.data('isotope-item-position', {x: x, y: y} );
      }
    },


    // ====================== General Layout ======================

    // used on collection of atoms (should be filtered, and sorted before )
    // accepts atoms-to-be-laid-out to start with
    layout : function( $elems, callback ) {

      var layoutMode = this.options.layoutMode;

      // layout logic
      this[ '_' +  layoutMode + 'Layout' ]( $elems );

      // set the size of the container
      if ( this.options.resizesContainer ) {
        var containerStyle = this[ '_' +  layoutMode + 'GetContainerSize' ]();
        this.styleQueue.push({ $el: this.element, style: containerStyle });
      }

      this._processStyleQueue( $elems, callback );

      this.isLaidOut = true;
    },

    _processStyleQueue : function( $elems, callback ) {
      // are we animating the layout arrangement?
      // use plugin-ish syntax for css or animate
      var styleFn = !this.isLaidOut ? 'css' : (
            this.isUsingJQueryAnimation ? 'animate' : 'css'
          ),
          animOpts = this.options.animationOptions,
          onLayout = this.options.onLayout,
          objStyleFn, processor,
          triggerCallbackNow, callbackFn;

      // default styleQueue processor, may be overwritten down below
      processor = function( i, obj ) {
        obj.$el[ styleFn ]( obj.style, animOpts );
      };

      if ( this._isInserting && this.isUsingJQueryAnimation ) {
        // if using styleQueue to insert items
        processor = function( i, obj ) {
          // only animate if it not being inserted
          objStyleFn = obj.$el.hasClass('no-transition') ? 'css' : styleFn;
          obj.$el[ objStyleFn ]( obj.style, animOpts );
        };

      } else if ( callback || onLayout || animOpts.complete ) {
        // has callback
        var isCallbackTriggered = false,
            // array of possible callbacks to trigger
            callbacks = [ callback, onLayout, animOpts.complete ],
            instance = this;
        triggerCallbackNow = true;
        // trigger callback only once
        callbackFn = function() {
          if ( isCallbackTriggered ) {
            return;
          }
          var hollaback;
          for (var i=0, len = callbacks.length; i < len; i++) {
            hollaback = callbacks[i];
            if ( typeof hollaback === 'function' ) {
              hollaback.call( instance.element, $elems, instance );
            }
          }
          isCallbackTriggered = true;
        };

        if ( this.isUsingJQueryAnimation && styleFn === 'animate' ) {
          // add callback to animation options
          animOpts.complete = callbackFn;
          triggerCallbackNow = false;

        } else if ( Modernizr.csstransitions ) {
          // detect if first item has transition
          var i = 0,
              firstItem = this.styleQueue[0],
              testElem = firstItem && firstItem.$el,
              styleObj;
          // get first non-empty jQ object
          while ( !testElem || !testElem.length ) {
            styleObj = this.styleQueue[ i++ ];
            // HACK: sometimes styleQueue[i] is undefined
            if ( !styleObj ) {
              return;
            }
            testElem = styleObj.$el;
          }
          // get transition duration of the first element in that object
          // yeah, this is inexact
          var duration = parseFloat( getComputedStyle( testElem[0] )[ transitionDurProp ] );
          if ( duration > 0 ) {
            processor = function( i, obj ) {
              obj.$el[ styleFn ]( obj.style, animOpts )
                // trigger callback at transition end
                .one( transitionEndEvent, callbackFn );
            };
            triggerCallbackNow = false;
          }
        }
      }

      // process styleQueue
      $.each( this.styleQueue, processor );

      if ( triggerCallbackNow ) {
        callbackFn();
      }

      // clear out queue for next time
      this.styleQueue = [];
    },


    resize : function() {
      if ( this[ '_' + this.options.layoutMode + 'ResizeChanged' ]() ) {
        this.reLayout();
      }
    },


    reLayout : function( callback ) {

      this[ '_' +  this.options.layoutMode + 'Reset' ]();
      this.layout( this.$filteredAtoms, callback );

    },

    // ====================== Convenience methods ======================

    // ====================== Adding items ======================

    // adds a jQuery object of items to a isotope container
    addItems : function( $content, callback ) {
      var $newAtoms = this._getAtoms( $content );
      // add new atoms to atoms pools
      this.$allAtoms = this.$allAtoms.add( $newAtoms );

      if ( callback ) {
        callback( $newAtoms );
      }
    },

    // convienence method for adding elements properly to any layout
    // positions items, hides them, then animates them back in <--- very sezzy
    insert : function( $content, callback ) {
      // position items
      this.element.append( $content );

      var instance = this;
      this.addItems( $content, function( $newAtoms ) {
        var $newFilteredAtoms = instance._filter( $newAtoms );
        instance._addHideAppended( $newFilteredAtoms );
        instance._sort();
        instance.reLayout();
        instance._revealAppended( $newFilteredAtoms, callback );
      });

    },

    // convienence method for working with Infinite Scroll
    appended : function( $content, callback ) {
      var instance = this;
      this.addItems( $content, function( $newAtoms ) {
        instance._addHideAppended( $newAtoms );
        instance.layout( $newAtoms );
        instance._revealAppended( $newAtoms, callback );
      });
    },

    // adds new atoms, then hides them before positioning
    _addHideAppended : function( $newAtoms ) {
      this.$filteredAtoms = this.$filteredAtoms.add( $newAtoms );
      $newAtoms.addClass('no-transition');

      this._isInserting = true;

      // apply hidden styles
      this.styleQueue.push({ $el: $newAtoms, style: this.options.hiddenStyle });
    },

    // sets visible style on new atoms
    _revealAppended : function( $newAtoms, callback ) {
      var instance = this;
      // apply visible style after a sec
      setTimeout( function() {
        // enable animation
        $newAtoms.removeClass('no-transition');
        // reveal newly inserted filtered elements
        instance.styleQueue.push({ $el: $newAtoms, style: instance.options.visibleStyle });
        instance._isInserting = false;
        instance._processStyleQueue( $newAtoms, callback );
      }, 10 );
    },

    // gathers all atoms
    reloadItems : function() {
      this.$allAtoms = this._getAtoms( this.element.children() );
    },

    // removes elements from Isotope widget
    remove: function( $content, callback ) {
      // remove elements immediately from Isotope instance
      this.$allAtoms = this.$allAtoms.not( $content );
      this.$filteredAtoms = this.$filteredAtoms.not( $content );
      // remove() as a callback, for after transition / animation
      var instance = this;
      var removeContent = function() {
        $content.remove();
        if ( callback ) {
          callback.call( instance.element );
        }
      };

      if ( $content.filter( ':not(.' + this.options.hiddenClass + ')' ).length ) {
        // if any non-hidden content needs to be removed
        this.styleQueue.push({ $el: $content, style: this.options.hiddenStyle });
        this._sort();
        this.reLayout( removeContent );
      } else {
        // remove it now
        removeContent();
      }

    },

    shuffle : function( callback ) {
      this.updateSortData( this.$allAtoms );
      this.options.sortBy = 'random';
      this._sort();
      this.reLayout( callback );
    },

    // destroys widget, returns elements and container back (close) to original style
    destroy : function() {

      var usingTransforms = this.usingTransforms;
      var options = this.options;

      this.$allAtoms
        .removeClass( options.hiddenClass + ' ' + options.itemClass )
        .each(function(){
          var style = this.style;
          style.position = '';
          style.top = '';
          style.left = '';
          style.opacity = '';
          if ( usingTransforms ) {
            style[ transformProp ] = '';
          }
        });

      // re-apply saved container styles
      var elemStyle = this.element[0].style;
      for ( var prop in this.originalStyle ) {
        elemStyle[ prop ] = this.originalStyle[ prop ];
      }

      this.element
        .unbind('.isotope')
        .undelegate( '.' + options.hiddenClass, 'click' )
        .removeClass( options.containerClass )
        .removeData('isotope');

      $window.unbind('.isotope');

    },


    // ====================== LAYOUTS ======================

    // calculates number of rows or columns
    // requires columnWidth or rowHeight to be set on namespaced object
    // i.e. this.masonry.columnWidth = 200
    _getSegments : function( isRows ) {
      var namespace = this.options.layoutMode,
          measure  = isRows ? 'rowHeight' : 'columnWidth',
          size     = isRows ? 'height' : 'width',
          segmentsName = isRows ? 'rows' : 'cols',
          containerSize = this.element[ size ](),
          segments,
                    // i.e. options.masonry && options.masonry.columnWidth
          segmentSize = this.options[ namespace ] && this.options[ namespace ][ measure ] ||
                    // or use the size of the first item, i.e. outerWidth
                    this.$filteredAtoms[ 'outer' + capitalize(size) ](true) ||
                    // if there's no items, use size of container
                    containerSize;

      segments = Math.floor( containerSize / segmentSize );
      segments = Math.max( segments, 1 );

      // i.e. this.masonry.cols = ....
      this[ namespace ][ segmentsName ] = segments;
      // i.e. this.masonry.columnWidth = ...
      this[ namespace ][ measure ] = segmentSize;

    },

    _checkIfSegmentsChanged : function( isRows ) {
      var namespace = this.options.layoutMode,
          segmentsName = isRows ? 'rows' : 'cols',
          prevSegments = this[ namespace ][ segmentsName ];
      // update cols/rows
      this._getSegments( isRows );
      // return if updated cols/rows is not equal to previous
      return ( this[ namespace ][ segmentsName ] !== prevSegments );
    },

    // ====================== Masonry ======================

    _masonryReset : function() {
      // layout-specific props
      this.masonry = {};
      // FIXME shouldn't have to call this again
      this._getSegments();
      var i = this.masonry.cols;
      this.masonry.colYs = [];
      while (i--) {
        this.masonry.colYs.push( 0 );
      }
    },

    _masonryLayout : function( $elems ) {
      var instance = this,
          props = instance.masonry;
      $elems.each(function(){
        var $this  = $(this),
            //how many columns does this brick span
            colSpan = Math.ceil( $this.outerWidth(true) / props.columnWidth );
        colSpan = Math.min( colSpan, props.cols );

        if ( colSpan === 1 ) {
          // if brick spans only one column, just like singleMode
          instance._masonryPlaceBrick( $this, props.colYs );
        } else {
          // brick spans more than one column
          // how many different places could this brick fit horizontally
          var groupCount = props.cols + 1 - colSpan,
              groupY = [],
              groupColY,
              i;

          // for each group potential horizontal position
          for ( i=0; i < groupCount; i++ ) {
            // make an array of colY values for that one group
            groupColY = props.colYs.slice( i, i+colSpan );
            // and get the max value of the array
            groupY[i] = Math.max.apply( Math, groupColY );
          }

          instance._masonryPlaceBrick( $this, groupY );
        }
      });
    },

    // worker method that places brick in the columnSet
    //   with the the minY
    _masonryPlaceBrick : function( $brick, setY ) {
      // get the minimum Y value from the columns
      var minimumY = Math.min.apply( Math, setY ),
          shortCol = 0;

      // Find index of short column, the first from the left
      for (var i=0, len = setY.length; i < len; i++) {
        if ( setY[i] === minimumY ) {
          shortCol = i;
          break;
        }
      }

      // position the brick
      var x = this.masonry.columnWidth * shortCol,
          y = minimumY;
      this._pushPosition( $brick, x, y );

      // apply setHeight to necessary columns
      var setHeight = minimumY + $brick.outerHeight(true),
          setSpan = this.masonry.cols + 1 - len;
      for ( i=0; i < setSpan; i++ ) {
        this.masonry.colYs[ shortCol + i ] = setHeight;
      }

    },

    _masonryGetContainerSize : function() {
      var containerHeight = Math.max.apply( Math, this.masonry.colYs );
      return { height: containerHeight };
    },

    _masonryResizeChanged : function() {
      return this._checkIfSegmentsChanged();
    },

    // ====================== fitRows ======================

    _fitRowsReset : function() {
      this.fitRows = {
        x : 0,
        y : 0,
        height : 0
      };
    },

    _fitRowsLayout : function( $elems ) {
      var instance = this,
          containerWidth = this.element.width(),
          props = this.fitRows;

      $elems.each( function() {
        var $this = $(this),
            atomW = $this.outerWidth(true),
            atomH = $this.outerHeight(true);

        if ( props.x !== 0 && atomW + props.x > containerWidth ) {
          // if this element cannot fit in the current row
          props.x = 0;
          props.y = props.height;
        }

        // position the atom
        instance._pushPosition( $this, props.x, props.y );

        props.height = Math.max( props.y + atomH, props.height );
        props.x += atomW;

      });
    },

    _fitRowsGetContainerSize : function () {
      return { height : this.fitRows.height };
    },

    _fitRowsResizeChanged : function() {
      return true;
    },


    // ====================== cellsByRow ======================

    _cellsByRowReset : function() {
      this.cellsByRow = {
        index : 0
      };
      // get this.cellsByRow.columnWidth
      this._getSegments();
      // get this.cellsByRow.rowHeight
      this._getSegments(true);
    },

    _cellsByRowLayout : function( $elems ) {
      var instance = this,
          props = this.cellsByRow;
      $elems.each( function(){
        var $this = $(this),
            col = props.index % props.cols,
            row = Math.floor( props.index / props.cols ),
            x = ( col + 0.5 ) * props.columnWidth - $this.outerWidth(true) / 2,
            y = ( row + 0.5 ) * props.rowHeight - $this.outerHeight(true) / 2;
        instance._pushPosition( $this, x, y );
        props.index ++;
      });
    },

    _cellsByRowGetContainerSize : function() {
      return { height : Math.ceil( this.$filteredAtoms.length / this.cellsByRow.cols ) * this.cellsByRow.rowHeight + this.offset.top };
    },

    _cellsByRowResizeChanged : function() {
      return this._checkIfSegmentsChanged();
    },


    // ====================== straightDown ======================

    _straightDownReset : function() {
      this.straightDown = {
        y : 0
      };
    },

    _straightDownLayout : function( $elems ) {
      var instance = this;
      $elems.each( function( i ){
        var $this = $(this);
        instance._pushPosition( $this, 0, instance.straightDown.y );
        instance.straightDown.y += $this.outerHeight(true);
      });
    },

    _straightDownGetContainerSize : function() {
      return { height : this.straightDown.y };
    },

    _straightDownResizeChanged : function() {
      return true;
    },


    // ====================== masonryHorizontal ======================

    _masonryHorizontalReset : function() {
      // layout-specific props
      this.masonryHorizontal = {};
      // FIXME shouldn't have to call this again
      this._getSegments( true );
      var i = this.masonryHorizontal.rows;
      this.masonryHorizontal.rowXs = [];
      while (i--) {
        this.masonryHorizontal.rowXs.push( 0 );
      }
    },

    _masonryHorizontalLayout : function( $elems ) {
      var instance = this,
          props = instance.masonryHorizontal;
      $elems.each(function(){
        var $this  = $(this),
            //how many rows does this brick span
            rowSpan = Math.ceil( $this.outerHeight(true) / props.rowHeight );
        rowSpan = Math.min( rowSpan, props.rows );

        if ( rowSpan === 1 ) {
          // if brick spans only one column, just like singleMode
          instance._masonryHorizontalPlaceBrick( $this, props.rowXs );
        } else {
          // brick spans more than one row
          // how many different places could this brick fit horizontally
          var groupCount = props.rows + 1 - rowSpan,
              groupX = [],
              groupRowX, i;

          // for each group potential horizontal position
          for ( i=0; i < groupCount; i++ ) {
            // make an array of colY values for that one group
            groupRowX = props.rowXs.slice( i, i+rowSpan );
            // and get the max value of the array
            groupX[i] = Math.max.apply( Math, groupRowX );
          }

          instance._masonryHorizontalPlaceBrick( $this, groupX );
        }
      });
    },

    _masonryHorizontalPlaceBrick : function( $brick, setX ) {
      // get the minimum Y value from the columns
      var minimumX  = Math.min.apply( Math, setX ),
          smallRow  = 0;
      // Find index of smallest row, the first from the top
      for (var i=0, len = setX.length; i < len; i++) {
        if ( setX[i] === minimumX ) {
          smallRow = i;
          break;
        }
      }

      // position the brick
      var x = minimumX,
          y = this.masonryHorizontal.rowHeight * smallRow;
      this._pushPosition( $brick, x, y );

      // apply setHeight to necessary columns
      var setWidth = minimumX + $brick.outerWidth(true),
          setSpan = this.masonryHorizontal.rows + 1 - len;
      for ( i=0; i < setSpan; i++ ) {
        this.masonryHorizontal.rowXs[ smallRow + i ] = setWidth;
      }
    },

    _masonryHorizontalGetContainerSize : function() {
      var containerWidth = Math.max.apply( Math, this.masonryHorizontal.rowXs );
      return { width: containerWidth };
    },

    _masonryHorizontalResizeChanged : function() {
      return this._checkIfSegmentsChanged(true);
    },


    // ====================== fitColumns ======================

    _fitColumnsReset : function() {
      this.fitColumns = {
        x : 0,
        y : 0,
        width : 0
      };
    },

    _fitColumnsLayout : function( $elems ) {
      var instance = this,
          containerHeight = this.element.height(),
          props = this.fitColumns;
      $elems.each( function() {
        var $this = $(this),
            atomW = $this.outerWidth(true),
            atomH = $this.outerHeight(true);

        if ( props.y !== 0 && atomH + props.y > containerHeight ) {
          // if this element cannot fit in the current column
          props.x = props.width;
          props.y = 0;
        }

        // position the atom
        instance._pushPosition( $this, props.x, props.y );

        props.width = Math.max( props.x + atomW, props.width );
        props.y += atomH;

      });
    },

    _fitColumnsGetContainerSize : function () {
      return { width : this.fitColumns.width };
    },

    _fitColumnsResizeChanged : function() {
      return true;
    },



    // ====================== cellsByColumn ======================

    _cellsByColumnReset : function() {
      this.cellsByColumn = {
        index : 0
      };
      // get this.cellsByColumn.columnWidth
      this._getSegments();
      // get this.cellsByColumn.rowHeight
      this._getSegments(true);
    },

    _cellsByColumnLayout : function( $elems ) {
      var instance = this,
          props = this.cellsByColumn;
      $elems.each( function(){
        var $this = $(this),
            col = Math.floor( props.index / props.rows ),
            row = props.index % props.rows,
            x = ( col + 0.5 ) * props.columnWidth - $this.outerWidth(true) / 2,
            y = ( row + 0.5 ) * props.rowHeight - $this.outerHeight(true) / 2;
        instance._pushPosition( $this, x, y );
        props.index ++;
      });
    },

    _cellsByColumnGetContainerSize : function() {
      return { width : Math.ceil( this.$filteredAtoms.length / this.cellsByColumn.rows ) * this.cellsByColumn.columnWidth };
    },

    _cellsByColumnResizeChanged : function() {
      return this._checkIfSegmentsChanged(true);
    },

    // ====================== straightAcross ======================

    _straightAcrossReset : function() {
      this.straightAcross = {
        x : 0
      };
    },

    _straightAcrossLayout : function( $elems ) {
      var instance = this;
      $elems.each( function( i ){
        var $this = $(this);
        instance._pushPosition( $this, instance.straightAcross.x, 0 );
        instance.straightAcross.x += $this.outerWidth(true);
      });
    },

    _straightAcrossGetContainerSize : function() {
      return { width : this.straightAcross.x };
    },

    _straightAcrossResizeChanged : function() {
      return true;
    }

  };


  // ======================= imagesLoaded Plugin ===============================
  /*!
   * jQuery imagesLoaded plugin v1.1.0
   * http://github.com/desandro/imagesloaded
   *
   * MIT License. by Paul Irish et al.
   */


  // $('#my-container').imagesLoaded(myFunction)
  // or
  // $('img').imagesLoaded(myFunction)

  // execute a callback when all images have loaded.
  // needed because .load() doesn't work on cached images

  // callback function gets image collection as argument
  //  `this` is the container

  $.fn.imagesLoaded = function( callback ) {
    var $this = this,
        $images = $this.find('img').add( $this.filter('img') ),
        len = $images.length,
        blank = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
        loaded = [];

    function triggerCallback() {
      callback.call( $this, $images );
    }

    function imgLoaded( event ) {
      var img = event.target;
      if ( img.src !== blank && $.inArray( img, loaded ) === -1 ){
        loaded.push( img );
        if ( --len <= 0 ){
          setTimeout( triggerCallback );
          $images.unbind( '.imagesLoaded', imgLoaded );
        }
      }
    }

    // if no images, trigger immediately
    if ( !len ) {
      triggerCallback();
    }

    $images.bind( 'load.imagesLoaded error.imagesLoaded',  imgLoaded ).each( function() {
      // cached images don't fire load sometimes, so we reset src.
      var src = this.src;
      // webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
      // data uri bypasses webkit log warning (thx doug jones)
      this.src = blank;
      this.src = src;
    });

    return $this;
  };


  // helper function for logging errors
  // $.error breaks jQuery chaining
  var logError = function( message ) {
    if ( window.console ) {
      window.console.error( message );
    }
  };

  // =======================  Plugin bridge  ===============================
  // leverages data method to either create or return $.Isotope constructor
  // A bit from jQuery UI
  //   https://github.com/jquery/jquery-ui/blob/master/ui/jquery.ui.widget.js
  // A bit from jcarousel
  //   https://github.com/jsor/jcarousel/blob/master/lib/jquery.jcarousel.js

  $.fn.isotope = function( options, callback ) {
    if ( typeof options === 'string' ) {
      // call method
      var args = Array.prototype.slice.call( arguments, 1 );

      this.each(function(){
        var instance = $.data( this, 'isotope' );
        if ( !instance ) {
          logError( "cannot call methods on isotope prior to initialization; " +
              "attempted to call method '" + options + "'" );
          return;
        }
        if ( !$.isFunction( instance[options] ) || options.charAt(0) === "_" ) {
          logError( "no such method '" + options + "' for isotope instance" );
          return;
        }
        // apply method
        instance[ options ].apply( instance, args );
      });
    } else {
      this.each(function() {
        var instance = $.data( this, 'isotope' );
        if ( instance ) {
          // apply options & init
          instance.option( options );
          instance._init( callback );
        } else {
          // initialize new instance
          $.data( this, 'isotope', new $.Isotope( options, this, callback ) );
        }
      });
    }
    // return jQuery object
    // so plugin methods do not have to
    return this;
  };

})( window, jQuery );



// ==========================================================================================================
// ==========================================================================================================
// ==========================================================================================================

/**!
 * MixItUp v2.1.9
 *
 * @copyright Copyright 2015 KunkaLabs Limited.
 * @author    KunkaLabs Limited.
 * @link      https://mixitup.kunkalabs.com
 *
 * @license   Commercial use requires a commercial license.
 *            https://mixitup.kunkalabs.com/licenses/
 *
 *            Non-commercial use permitted under terms of CC-BY-NC license.
 *            http://creativecommons.org/licenses/by-nc/3.0/
 */

(function($, undf){
  
  /**
   * MixItUp Constructor Function
   * @constructor
   * @extends jQuery
   */
  
  $.MixItUp = function(){
    var self = this;
    
    self._execAction('_constructor', 0);
    
    $.extend(self, {
      
      /* Public Properties
      ---------------------------------------------------------------------- */
      
      selectors: {
        target: '.mix',
        filter: '.filter',
        sort: '.sort'
      },
        
      animation: {
        enable: true,
        effects: 'fade scale',
        duration: 600,
        easing: 'ease',
        perspectiveDistance: '3000',
        perspectiveOrigin: '50% 50%',
        queue: true,
        queueLimit: 1,
        animateChangeLayout: false,
        animateResizeContainer: true,
        animateResizeTargets: false,
        staggerSequence: false,
        reverseOut: false
      },
        
      callbacks: {
        onMixLoad: false,
        onMixStart: false,
        onMixBusy: false,
        onMixEnd: false,
        onMixFail: false,
        _user: false
      },
        
      controls: {
        enable: true,
        live: false,
        toggleFilterButtons: false,
        toggleLogic: 'or',
        activeClass: 'active'
      },

      layout: {
        display: 'inline-block',
        containerClass: '',
        containerClassFail: 'fail'
      },
      
      load: {
        filter: 'all',
        sort: false
      },
      
      /* Private Properties
      ---------------------------------------------------------------------- */
        
      _$body: null,
      _$container: null,
      _$targets: null,
      _$parent: null,
      _$sortButtons: null,
      _$filterButtons: null,
    
      _suckMode: false,
      _mixing: false,
      _sorting: false,
      _clicking: false,
      _loading: true,
      _changingLayout: false,
      _changingClass: false,
      _changingDisplay: false,
      
      _origOrder: [],
      _startOrder: [],
      _newOrder: [],
      _activeFilter: null,
      _toggleArray: [],
      _toggleString: '',
      _activeSort: 'default:asc',
      _newSort: null,
      _startHeight: null,
      _newHeight: null,
      _incPadding: true,
      _newDisplay: null,
      _newClass: null,
      _targetsBound: 0,
      _targetsDone: 0,
      _queue: [],
        
      _$show: $(),
      _$hide: $()
    });
  
    self._execAction('_constructor', 1);
  };
  
  /**
   * MixItUp Prototype
   * @override
   */
  
  $.MixItUp.prototype = {
    constructor: $.MixItUp,
    
    /* Static Properties
    ---------------------------------------------------------------------- */
    
    _instances: {},
    _handled: {
      _filter: {},
      _sort: {}
    },
    _bound: {
      _filter: {},
      _sort: {}
    },
    _actions: {},
    _filters: {},
    
    /* Static Methods
    ---------------------------------------------------------------------- */
    
    /**
     * Extend
     * @since 2.1.0
     * @param {object} new properties/methods
     * @extends {object} prototype
     */
    
    extend: function(extension){
      for(var key in extension){
        $.MixItUp.prototype[key] = extension[key];
      }
    },
    
    /**
     * Add Action
     * @since 2.1.0
     * @param {string} hook name
     * @param {string} namespace
     * @param {function} function to execute
     * @param {number} priority
     * @extends {object} $.MixItUp.prototype._actions
     */
    
    addAction: function(hook, name, func, priority){
      $.MixItUp.prototype._addHook('_actions', hook, name, func, priority);
    },
    
    /**
     * Add Filter
     * @since 2.1.0
     * @param {string} hook name
     * @param {string} namespace
     * @param {function} function to execute
     * @param {number} priority
     * @extends {object} $.MixItUp.prototype._filters
     */
    
    addFilter: function(hook, name, func, priority){
      $.MixItUp.prototype._addHook('_filters', hook, name, func, priority);
    },
    
    /**
     * Add Hook
     * @since 2.1.0
     * @param {string} type of hook
     * @param {string} hook name
     * @param {function} function to execute
     * @param {number} priority
     * @extends {object} $.MixItUp.prototype._filters
     */
    
    _addHook: function(type, hook, name, func, priority){
      var collection = $.MixItUp.prototype[type],
        obj = {};
        
      priority = (priority === 1 || priority === 'post') ? 'post' : 'pre';
        
      obj[hook] = {};
      obj[hook][priority] = {};
      obj[hook][priority][name] = func;

      $.extend(true, collection, obj);
    },
    
    
    /* Private Methods
    ---------------------------------------------------------------------- */
    
    /**
     * Initialise
     * @since 2.0.0
     * @param {object} domNode
     * @param {object} config
     */
    
    _init: function(domNode, config){
      var self = this;
      
      self._execAction('_init', 0, arguments);
      
      config && $.extend(true, self, config);
      
      self._$body = $('body');
      self._domNode = domNode;
      self._$container = $(domNode);
      self._$container.addClass(self.layout.containerClass);
      self._id = domNode.id;
      
      self._platformDetect();
      
      self._brake = self._getPrefixedCSS('transition', 'none');
      
      self._refresh(true);
      
      self._$parent = self._$targets.parent().length ? self._$targets.parent() : self._$container;
      
      if(self.load.sort){
        self._newSort = self._parseSort(self.load.sort);
        self._newSortString = self.load.sort;
        self._activeSort = self.load.sort;
        self._sort();
        self._printSort();
      }
      
      self._activeFilter = self.load.filter === 'all' ? 
        self.selectors.target : 
        self.load.filter === 'none' ?
          '' :
          self.load.filter;
      
      self.controls.enable && self._bindHandlers();
      
      if(self.controls.toggleFilterButtons){
        self._buildToggleArray();
        
        for(var i = 0; i < self._toggleArray.length; i++){
          self._updateControls({filter: self._toggleArray[i], sort: self._activeSort}, true);
        };
      } else if(self.controls.enable){
        self._updateControls({filter: self._activeFilter, sort: self._activeSort});
      }
      
      self._filter();
      
      self._init = true;
      
      self._$container.data('mixItUp',self);
      
      self._execAction('_init', 1, arguments);
      
      self._buildState();
      
      self._$targets.css(self._brake);
    
      self._goMix(self.animation.enable);
    },
    
    /**
     * Platform Detect
     * @since 2.0.0
     */
    
    _platformDetect: function(){
      var self = this,
        vendorsTrans = ['Webkit', 'Moz', 'O', 'ms'],
        vendorsRAF = ['webkit', 'moz'],
        chrome = window.navigator.appVersion.match(/Chrome\/(\d+)\./) || false,
        ff = typeof InstallTrigger !== 'undefined',
        prefix = function(el){
          for (var i = 0; i < vendorsTrans.length; i++){
            if (vendorsTrans[i] + 'Transition' in el.style){
              return {
                prefix: '-'+vendorsTrans[i].toLowerCase()+'-',
                vendor: vendorsTrans[i]
              };
            };
          }; 
          return 'transition' in el.style ? '' : false;
        },
        transPrefix = prefix(self._domNode);
        
      self._execAction('_platformDetect', 0);
      
      self._chrome = chrome ? parseInt(chrome[1], 10) : false;
      self._ff = ff ? parseInt(window.navigator.userAgent.match(/rv:([^)]+)\)/)[1]) : false;
      self._prefix = transPrefix.prefix;
      self._vendor = transPrefix.vendor;
      self._suckMode = window.atob && self._prefix ? false : true;

      self._suckMode && (self.animation.enable = false);
      (self._ff && self._ff <= 4) && (self.animation.enable = false);
      
      /* Polyfills
      ---------------------------------------------------------------------- */
      
      /**
       * window.requestAnimationFrame
       */
      
      for(var x = 0; x < vendorsRAF.length && !window.requestAnimationFrame; x++){
        window.requestAnimationFrame = window[vendorsRAF[x]+'RequestAnimationFrame'];
      }

      /**
       * Object.getPrototypeOf
       */

      if(typeof Object.getPrototypeOf !== 'function'){
        if(typeof 'test'.__proto__ === 'object'){
          Object.getPrototypeOf = function(object){
            return object.__proto__;
          };
        } else {
          Object.getPrototypeOf = function(object){
            return object.constructor.prototype;
          };
        }
      }

      /**
       * Element.nextElementSibling
       */
      
      if(self._domNode.nextElementSibling === undf){
        Object.defineProperty(Element.prototype, 'nextElementSibling',{
          get: function(){
            var el = this.nextSibling;
            
            while(el){
              if(el.nodeType ===1){
                return el;
              }
              el = el.nextSibling;
            }
            return null;
          }
        });
      }
      
      self._execAction('_platformDetect', 1);
    },
    
    /**
     * Refresh
     * @since 2.0.0
     * @param {boolean} init
     * @param {boolean} force
     */
    
    _refresh: function(init, force){
      var self = this;
        
      self._execAction('_refresh', 0, arguments);

      self._$targets = self._$container.find(self.selectors.target);
      
      for(var i = 0; i < self._$targets.length; i++){
        var target = self._$targets[i];
          
        if(target.dataset === undf || force){
            
          target.dataset = {};
          
          for(var j = 0; j < target.attributes.length; j++){
            
            var attr = target.attributes[j],
              name = attr.name,
              val = attr.value;
              
            if(name.indexOf('data-') > -1){
              var dataName = self._helpers._camelCase(name.substring(5,name.length));
              target.dataset[dataName] = val;
            }
          }
        }
        
        if(target.mixParent === undf){
          target.mixParent = self._id;
        }
      }
      
      if(
        (self._$targets.length && init) ||
        (!self._origOrder.length && self._$targets.length)
      ){
        self._origOrder = [];
        
        for(var i = 0; i < self._$targets.length; i++){
          var target = self._$targets[i];
          
          self._origOrder.push(target);
        }
      }
      
      self._execAction('_refresh', 1, arguments);
    },
    
    /**
     * Bind Handlers
     * @since 2.0.0
     */
    
    _bindHandlers: function(){
      var self = this,
        filters = $.MixItUp.prototype._bound._filter,
        sorts = $.MixItUp.prototype._bound._sort;
      
      self._execAction('_bindHandlers', 0);
      
      if(self.controls.live){
        self._$body
          .on('click.mixItUp.'+self._id, self.selectors.sort, function(){
            self._processClick($(this), 'sort');
          })
          .on('click.mixItUp.'+self._id, self.selectors.filter, function(){
            self._processClick($(this), 'filter');
          });
      } else {
        self._$sortButtons = $(self.selectors.sort);
        self._$filterButtons = $(self.selectors.filter);
        
        self._$sortButtons.on('click.mixItUp.'+self._id, function(){
          self._processClick($(this), 'sort');
        });
        
        self._$filterButtons.on('click.mixItUp.'+self._id, function(){
          self._processClick($(this), 'filter');
        });
      }

      filters[self.selectors.filter] = (filters[self.selectors.filter] === undf) ? 1 : filters[self.selectors.filter] + 1;
      sorts[self.selectors.sort] = (sorts[self.selectors.sort] === undf) ? 1 : sorts[self.selectors.sort] + 1;
      
      self._execAction('_bindHandlers', 1);
    },
    
    /**
     * Process Click
     * @since 2.0.0
     * @param {object} $button
     * @param {string} type
     */
    
    _processClick: function($button, type){
      var self = this,
        trackClick = function($button, type, off){
          var proto = $.MixItUp.prototype;
            
          proto._handled['_'+type][self.selectors[type]] = (proto._handled['_'+type][self.selectors[type]] === undf) ? 
            1 : 
            proto._handled['_'+type][self.selectors[type]] + 1;

          if(proto._handled['_'+type][self.selectors[type]] === proto._bound['_'+type][self.selectors[type]]){
            $button[(off ? 'remove' : 'add')+'Class'](self.controls.activeClass);
            delete proto._handled['_'+type][self.selectors[type]];
          }
        };
      
      self._execAction('_processClick', 0, arguments);
      
      if(!self._mixing || (self.animation.queue && self._queue.length < self.animation.queueLimit)){
        self._clicking = true;
        
        if(type === 'sort'){
          var sort = $button.attr('data-sort');
          
          if(!$button.hasClass(self.controls.activeClass) || sort.indexOf('random') > -1){
            $(self.selectors.sort).removeClass(self.controls.activeClass);
            trackClick($button, type);
            self.sort(sort);
          }
        }
        
        if(type === 'filter') {
          var filter = $button.attr('data-filter'),
            ndx,
            seperator = self.controls.toggleLogic === 'or' ? ',' : '';
          
          if(!self.controls.toggleFilterButtons){
            if(!$button.hasClass(self.controls.activeClass)){
              $(self.selectors.filter).removeClass(self.controls.activeClass);
              trackClick($button, type);
              self.filter(filter);
            }
          } else {
            self._buildToggleArray();
            
            if(!$button.hasClass(self.controls.activeClass)){
              trackClick($button, type);
              
              self._toggleArray.push(filter);
            } else {
              trackClick($button, type, true);
              ndx = self._toggleArray.indexOf(filter);
              self._toggleArray.splice(ndx, 1);
            }
            
            self._toggleArray = $.grep(self._toggleArray,function(n){return(n);});
            
            self._toggleString = self._toggleArray.join(seperator);

            self.filter(self._toggleString);
          }
        }
        
        self._execAction('_processClick', 1, arguments);
      } else {
        if(typeof self.callbacks.onMixBusy === 'function'){
          self.callbacks.onMixBusy.call(self._domNode, self._state, self);
        }
        self._execAction('_processClickBusy', 1, arguments);
      }
    },
    
    /**
     * Build Toggle Array
     * @since 2.0.0
     */
    
    _buildToggleArray: function(){
      var self = this,
        activeFilter = self._activeFilter.replace(/\s/g, '');
      
      self._execAction('_buildToggleArray', 0, arguments);
      
      if(self.controls.toggleLogic === 'or'){
        self._toggleArray = activeFilter.split(',');
      } else {
        self._toggleArray = activeFilter.split('.');
        
        !self._toggleArray[0] && self._toggleArray.shift();
        
        for(var i = 0, filter; filter = self._toggleArray[i]; i++){
          self._toggleArray[i] = '.'+filter;
        }
      }
      
      self._execAction('_buildToggleArray', 1, arguments);
    },
    
    /**
     * Update Controls
     * @since 2.0.0
     * @param {object} command
     * @param {boolean} multi
     */
    
    _updateControls: function(command, multi){
      var self = this,
        output = {
          filter: command.filter,
          sort: command.sort
        },
        update = function($el, filter){
          try {
            (multi && type === 'filter' && !(output.filter === 'none' || output.filter === '')) ?
                $el.filter(filter).addClass(self.controls.activeClass) :
                $el.removeClass(self.controls.activeClass).filter(filter).addClass(self.controls.activeClass);
          } catch(e) {}
        },
        type = 'filter',
        $el = null;
        
      self._execAction('_updateControls', 0, arguments);
        
      (command.filter === undf) && (output.filter = self._activeFilter);
      (command.sort === undf) && (output.sort = self._activeSort);
      (output.filter === self.selectors.target) && (output.filter = 'all');
      
      for(var i = 0; i < 2; i++){
        $el = self.controls.live ? $(self.selectors[type]) : self['_$'+type+'Buttons'];
        $el && update($el, '[data-'+type+'="'+output[type]+'"]');
        type = 'sort';
      }
      
      self._execAction('_updateControls', 1, arguments);
    },
    
    /**
     * Filter (private)
     * @since 2.0.0
     */
    
    _filter: function(){
      var self = this;
      
      self._execAction('_filter', 0);
      
      for(var i = 0; i < self._$targets.length; i++){
        var $target = $(self._$targets[i]);
        
        if($target.is(self._activeFilter)){
          self._$show = self._$show.add($target);
        } else {
          self._$hide = self._$hide.add($target);
        }
      }
      
      self._execAction('_filter', 1);
    },
    
    /**
     * Sort (private)
     * @since 2.0.0
     */
    
    _sort: function(){
      var self = this,
        arrayShuffle = function(oldArray){
          var newArray = oldArray.slice(),
            len = newArray.length,
            i = len;

          while(i--){
            var p = parseInt(Math.random()*len);
            var t = newArray[i];
            newArray[i] = newArray[p];
            newArray[p] = t;
          };
          return newArray; 
        };
        
      self._execAction('_sort', 0);
      
      self._startOrder = [];
      
      for(var i = 0; i < self._$targets.length; i++){
        var target = self._$targets[i];
        
        self._startOrder.push(target);
      }
      
      switch(self._newSort[0].sortBy){
        case 'default':
          self._newOrder = self._origOrder;
          break;
        case 'random':
          self._newOrder = arrayShuffle(self._startOrder);
          break;
        case 'custom':
          self._newOrder = self._newSort[0].order;
          break;
        default:
          self._newOrder = self._startOrder.concat().sort(function(a, b){
            return self._compare(a, b);
          });
      }
      
      self._execAction('_sort', 1);
    },
    
    /**
     * Compare Algorithm
     * @since 2.0.0
     * @param {string|number} a
     * @param {string|number} b
     * @param {number} depth (recursion)
     * @return {number}
     */
    
    _compare: function(a, b, depth){
      depth = depth ? depth : 0;
    
      var self = this,
        order = self._newSort[depth].order,
        getData = function(el){
          return el.dataset[self._newSort[depth].sortBy] || 0;
        },
        attrA = isNaN(getData(a) * 1) ? getData(a).toLowerCase() : getData(a) * 1,
        attrB = isNaN(getData(b) * 1) ? getData(b).toLowerCase() : getData(b) * 1;
        
      if(attrA < attrB)
        return order === 'asc' ? -1 : 1;
      if(attrA > attrB)
        return order === 'asc' ? 1 : -1;
      if(attrA === attrB && self._newSort.length > depth+1)
        return self._compare(a, b, depth+1);

      return 0;
    },
    
    /**
     * Print Sort
     * @since 2.0.0
     * @param {boolean} reset
     */
    
    _printSort: function(reset){
      var self = this,
        order = reset ? self._startOrder : self._newOrder,
        targets = self._$parent[0].querySelectorAll(self.selectors.target),
        nextSibling = targets.length ? targets[targets.length -1].nextElementSibling : null,
        frag = document.createDocumentFragment();
        
      self._execAction('_printSort', 0, arguments);
      
      for(var i = 0; i < targets.length; i++){
        var target = targets[i],
          whiteSpace = target.nextSibling;

        if(target.style.position === 'absolute') continue;
      
        if(whiteSpace && whiteSpace.nodeName === '#text'){
          self._$parent[0].removeChild(whiteSpace);
        }
        
        self._$parent[0].removeChild(target);
      }
      
      for(var i = 0; i < order.length; i++){
        var el = order[i];

        if(self._newSort[0].sortBy === 'default' && self._newSort[0].order === 'desc' && !reset){
          var firstChild = frag.firstChild;
          frag.insertBefore(el, firstChild);
          frag.insertBefore(document.createTextNode(' '), el);
        } else {
          frag.appendChild(el);
          frag.appendChild(document.createTextNode(' '));
        }
      }
      
      nextSibling ? 
        self._$parent[0].insertBefore(frag, nextSibling) :
        self._$parent[0].appendChild(frag);
        
      self._execAction('_printSort', 1, arguments);
    },
    
    /**
     * Parse Sort
     * @since 2.0.0
     * @param {string} sortString
     * @return {array} newSort
     */
    
    _parseSort: function(sortString){
      var self = this,
        rules = typeof sortString === 'string' ? sortString.split(' ') : [sortString],
        newSort = [];
        
      for(var i = 0; i < rules.length; i++){
        var rule = typeof sortString === 'string' ? rules[i].split(':') : ['custom', rules[i]],
          ruleObj = {
            sortBy: self._helpers._camelCase(rule[0]),
            order: rule[1] || 'asc'
          };
          
        newSort.push(ruleObj);
        
        if(ruleObj.sortBy === 'default' || ruleObj.sortBy === 'random') break;
      }
      
      return self._execFilter('_parseSort', newSort, arguments);
    },
    
    /**
     * Parse Effects
     * @since 2.0.0
     * @return {object} effects
     */
    
    _parseEffects: function(){
      var self = this,
        effects = {
          opacity: '',
          transformIn: '',
          transformOut: '',
          filter: ''
        },
        parse = function(effect, extract, reverse){
          if(self.animation.effects.indexOf(effect) > -1){
            if(extract){
              var propIndex = self.animation.effects.indexOf(effect+'(');
              if(propIndex > -1){
                var str = self.animation.effects.substring(propIndex),
                  match = /\(([^)]+)\)/.exec(str),
                  val = match[1];

                  return {val: val};
              }
            }
            return true;
          } else {
            return false;
          }
        },
        negate = function(value, invert){
          if(invert){
            return value.charAt(0) === '-' ? value.substr(1, value.length) : '-'+value;
          } else {
            return value;
          }
        },
        buildTransform = function(key, invert){
          var transforms = [
            ['scale', '.01'],
            ['translateX', '20px'],
            ['translateY', '20px'],
            ['translateZ', '20px'],
            ['rotateX', '90deg'],
            ['rotateY', '90deg'],
            ['rotateZ', '180deg'],
          ];
          
          for(var i = 0; i < transforms.length; i++){
            var prop = transforms[i][0],
              def = transforms[i][1],
              inverted = invert && prop !== 'scale';
              
            effects[key] += parse(prop) ? prop+'('+negate(parse(prop, true).val || def, inverted)+') ' : '';
          }
        };
      
      effects.opacity = parse('fade') ? parse('fade',true).val || '0' : '1';
      
      buildTransform('transformIn');
      
      self.animation.reverseOut ? buildTransform('transformOut', true) : (effects.transformOut = effects.transformIn);

      effects.transition = {};
      
      effects.transition = self._getPrefixedCSS('transition','all '+self.animation.duration+'ms '+self.animation.easing+', opacity '+self.animation.duration+'ms linear');
    
      self.animation.stagger = parse('stagger') ? true : false;
      self.animation.staggerDuration = parseInt(parse('stagger') ? (parse('stagger',true).val ? parse('stagger',true).val : 100) : 100);

      return self._execFilter('_parseEffects', effects);
    },
    
    /**
     * Build State
     * @since 2.0.0
     * @param {boolean} future
     * @return {object} futureState
     */
    
    _buildState: function(future){
      var self = this,
        state = {};
      
      self._execAction('_buildState', 0);
      
      state = {
        activeFilter: self._activeFilter === '' ? 'none' : self._activeFilter,
        activeSort: future && self._newSortString ? self._newSortString : self._activeSort,
        fail: !self._$show.length && self._activeFilter !== '',
        $targets: self._$targets,
        $show: self._$show,
        $hide: self._$hide,
        totalTargets: self._$targets.length,
        totalShow: self._$show.length,
        totalHide: self._$hide.length,
        display: future && self._newDisplay ? self._newDisplay : self.layout.display
      };
      
      if(future){
        return self._execFilter('_buildState', state);
      } else {
        self._state = state;
        
        self._execAction('_buildState', 1);
      }
    },
    
    /**
     * Go Mix
     * @since 2.0.0
     * @param {boolean} animate
     */
    
    _goMix: function(animate){
      var self = this,
        phase1 = function(){
          if(self._chrome && (self._chrome === 31)){
            chromeFix(self._$parent[0]);
          }
          
          self._setInter();
          
          phase2();
        },
        phase2 = function(){
          var scrollTop = window.pageYOffset,
            scrollLeft = window.pageXOffset,
            docHeight = document.documentElement.scrollHeight;

          self._getInterMixData();
          
          self._setFinal();

          self._getFinalMixData();

          (window.pageYOffset !== scrollTop) && window.scrollTo(scrollLeft, scrollTop);

          self._prepTargets();
          
          if(window.requestAnimationFrame){
            requestAnimationFrame(phase3);
          } else {
            setTimeout(function(){
              phase3();
            },20);
          }
        },
        phase3 = function(){
          self._animateTargets();

          if(self._targetsBound === 0){
            self._cleanUp();
          }
        },
        chromeFix = function(grid){
          var parent = grid.parentElement,
            placeholder = document.createElement('div'),
            frag = document.createDocumentFragment();

          parent.insertBefore(placeholder, grid);
          frag.appendChild(grid);
          parent.replaceChild(grid, placeholder);
        },
        futureState = self._buildState(true);
        
      self._execAction('_goMix', 0, arguments);
        
      !self.animation.duration && (animate = false);

      self._mixing = true;
      
      self._$container.removeClass(self.layout.containerClassFail);
      
      if(typeof self.callbacks.onMixStart === 'function'){
        self.callbacks.onMixStart.call(self._domNode, self._state, futureState, self);
      }
      
      self._$container.trigger('mixStart', [self._state, futureState, self]);
      
      self._getOrigMixData();
      
      if(animate && !self._suckMode){
      
        window.requestAnimationFrame ?
          requestAnimationFrame(phase1) :
          phase1();
      
      } else {
        self._cleanUp();
      }
      
      self._execAction('_goMix', 1, arguments);
    },
    
    /**
     * Get Target Data
     * @since 2.0.0
     */
    
    _getTargetData: function(el, stage){
      var self = this,
        elStyle;
      
      el.dataset[stage+'PosX'] = el.offsetLeft;
      el.dataset[stage+'PosY'] = el.offsetTop;

      if(self.animation.animateResizeTargets){
        elStyle = !self._suckMode ? 
          window.getComputedStyle(el) : 
          {
            marginBottom: '',
            marginRight: ''
          };
      
        el.dataset[stage+'MarginBottom'] = parseInt(elStyle.marginBottom);
        el.dataset[stage+'MarginRight'] = parseInt(elStyle.marginRight);
        el.dataset[stage+'Width'] = el.offsetWidth;
        el.dataset[stage+'Height'] = el.offsetHeight;
      }
    },
    
    /**
     * Get Original Mix Data
     * @since 2.0.0
     */
    
    _getOrigMixData: function(){
      var self = this,
        parentStyle = !self._suckMode ? window.getComputedStyle(self._$parent[0]) : {boxSizing: ''},
        parentBS = parentStyle.boxSizing || parentStyle[self._vendor+'BoxSizing'];
  
      self._incPadding = (parentBS === 'border-box');
      
      self._execAction('_getOrigMixData', 0);
      
      !self._suckMode && (self.effects = self._parseEffects());
    
      self._$toHide = self._$hide.filter(':visible');
      self._$toShow = self._$show.filter(':hidden');
      self._$pre = self._$targets.filter(':visible');

      self._startHeight = self._incPadding ? 
        self._$parent.outerHeight() : 
        self._$parent.height();
        
      for(var i = 0; i < self._$pre.length; i++){
        var el = self._$pre[i];
        
        self._getTargetData(el, 'orig');
      }
      
      self._execAction('_getOrigMixData', 1);
    },
    
    /**
     * Set Intermediate Positions
     * @since 2.0.0
     */
    
    _setInter: function(){
      var self = this;
      
      self._execAction('_setInter', 0);
      
      if(self._changingLayout && self.animation.animateChangeLayout){
        self._$toShow.css('display',self._newDisplay);

        if(self._changingClass){
          self._$container
            .removeClass(self.layout.containerClass)
            .addClass(self._newClass);
        }
      } else {
        self._$toShow.css('display', self.layout.display);
      }
      
      self._execAction('_setInter', 1);
    },
    
    /**
     * Get Intermediate Mix Data
     * @since 2.0.0
     */
    
    _getInterMixData: function(){
      var self = this;
      
      self._execAction('_getInterMixData', 0);
      
      for(var i = 0; i < self._$toShow.length; i++){
        var el = self._$toShow[i];
          
        self._getTargetData(el, 'inter');
      }
      
      for(var i = 0; i < self._$pre.length; i++){
        var el = self._$pre[i];
          
        self._getTargetData(el, 'inter');
      }
      
      self._execAction('_getInterMixData', 1);
    },
    
    /**
     * Set Final Positions
     * @since 2.0.0
     */
    
    _setFinal: function(){
      var self = this;
      
      self._execAction('_setFinal', 0);
      
      self._sorting && self._printSort();

      self._$toHide.removeStyle('display');
      
      if(self._changingLayout && self.animation.animateChangeLayout){
        self._$pre.css('display',self._newDisplay);
      }
      
      self._execAction('_setFinal', 1);
    },
    
    /**
     * Get Final Mix Data
     * @since 2.0.0
     */
    
    _getFinalMixData: function(){
      var self = this;
      
      self._execAction('_getFinalMixData', 0);
  
      for(var i = 0; i < self._$toShow.length; i++){
        var el = self._$toShow[i];
          
        self._getTargetData(el, 'final');
      }
      
      for(var i = 0; i < self._$pre.length; i++){
        var el = self._$pre[i];
          
        self._getTargetData(el, 'final');
      }
      
      self._newHeight = self._incPadding ? 
        self._$parent.outerHeight() : 
        self._$parent.height();

      self._sorting && self._printSort(true);
  
      self._$toShow.removeStyle('display');
      
      self._$pre.css('display',self.layout.display);
      
      if(self._changingClass && self.animation.animateChangeLayout){
        self._$container
          .removeClass(self._newClass)
          .addClass(self.layout.containerClass);
      }
      
      self._execAction('_getFinalMixData', 1);
    },
    
    /**
     * Prepare Targets
     * @since 2.0.0
     */
    
    _prepTargets: function(){
      var self = this,
        transformCSS = {
          _in: self._getPrefixedCSS('transform', self.effects.transformIn),
          _out: self._getPrefixedCSS('transform', self.effects.transformOut)
        };

      self._execAction('_prepTargets', 0);
      
      if(self.animation.animateResizeContainer){
        self._$parent.css('height',self._startHeight+'px');
      }
      
      for(var i = 0; i < self._$toShow.length; i++){
        var el = self._$toShow[i],
          $el = $(el);
        
        el.style.opacity = self.effects.opacity;
        el.style.display = (self._changingLayout && self.animation.animateChangeLayout) ?
          self._newDisplay :
          self.layout.display;
          
        $el.css(transformCSS._in);
        
        if(self.animation.animateResizeTargets){
          el.style.width = el.dataset.finalWidth+'px';
          el.style.height = el.dataset.finalHeight+'px';
          el.style.marginRight = -(el.dataset.finalWidth - el.dataset.interWidth) + (el.dataset.finalMarginRight * 1)+'px';
          el.style.marginBottom = -(el.dataset.finalHeight - el.dataset.interHeight) + (el.dataset.finalMarginBottom * 1)+'px';
        }
      }

      for(var i = 0; i < self._$pre.length; i++){
        var el = self._$pre[i],
          $el = $(el),
          translate = {
            x: el.dataset.origPosX - el.dataset.interPosX,
            y: el.dataset.origPosY - el.dataset.interPosY
          },
          transformCSS = self._getPrefixedCSS('transform','translate('+translate.x+'px,'+translate.y+'px)');

        $el.css(transformCSS);
        
        if(self.animation.animateResizeTargets){
          el.style.width = el.dataset.origWidth+'px';
          el.style.height = el.dataset.origHeight+'px';
          
          if(el.dataset.origWidth - el.dataset.finalWidth){
            el.style.marginRight = -(el.dataset.origWidth - el.dataset.interWidth) + (el.dataset.origMarginRight * 1)+'px';
          }
          
          if(el.dataset.origHeight - el.dataset.finalHeight){
            el.style.marginBottom = -(el.dataset.origHeight - el.dataset.interHeight) + (el.dataset.origMarginBottom * 1) +'px';
          }
        }
      }
      
      self._execAction('_prepTargets', 1);
    },
    
    /**
     * Animate Targets
     * @since 2.0.0
     */
    
    _animateTargets: function(){
      var self = this;

      self._execAction('_animateTargets', 0);
      
      self._targetsDone = 0;
      self._targetsBound = 0;
      
      self._$parent
        .css(self._getPrefixedCSS('perspective', self.animation.perspectiveDistance+'px'))
        .css(self._getPrefixedCSS('perspective-origin', self.animation.perspectiveOrigin));
      
      if(self.animation.animateResizeContainer){
        self._$parent
          .css(self._getPrefixedCSS('transition','height '+self.animation.duration+'ms ease'))
          .css('height',self._newHeight+'px');
      }
      
      for(var i = 0; i < self._$toShow.length; i++){
        var el = self._$toShow[i],
          $el = $(el),
          translate = {
            x: el.dataset.finalPosX - el.dataset.interPosX,
            y: el.dataset.finalPosY - el.dataset.interPosY
          },
          delay = self._getDelay(i),
          toShowCSS = {};
        
        el.style.opacity = '';
        
        for(var j = 0; j < 2; j++){
          var a = j === 0 ? a = self._prefix : '';
          
          if(self._ff && self._ff <= 20){
            toShowCSS[a+'transition-property'] = 'all';
            toShowCSS[a+'transition-timing-function'] = self.animation.easing+'ms';
            toShowCSS[a+'transition-duration'] = self.animation.duration+'ms';
          }
          
          toShowCSS[a+'transition-delay'] = delay+'ms';
          toShowCSS[a+'transform'] = 'translate('+translate.x+'px,'+translate.y+'px)';
        }
        
        if(self.effects.transform || self.effects.opacity){
          self._bindTargetDone($el);
        }
        
        (self._ff && self._ff <= 20) ? 
          $el.css(toShowCSS) : 
          $el.css(self.effects.transition).css(toShowCSS);
      }
      
      for(var i = 0; i < self._$pre.length; i++){
        var el = self._$pre[i],
          $el = $(el),
          translate = {
            x: el.dataset.finalPosX - el.dataset.interPosX,
            y: el.dataset.finalPosY - el.dataset.interPosY
          },
          delay = self._getDelay(i);
          
        if(!(
          el.dataset.finalPosX === el.dataset.origPosX &&
          el.dataset.finalPosY === el.dataset.origPosY
        )){
          self._bindTargetDone($el);
        }
        
        $el.css(self._getPrefixedCSS('transition', 'all '+self.animation.duration+'ms '+self.animation.easing+' '+delay+'ms'));
        $el.css(self._getPrefixedCSS('transform', 'translate('+translate.x+'px,'+translate.y+'px)'));
        
        if(self.animation.animateResizeTargets){
          if(el.dataset.origWidth - el.dataset.finalWidth && el.dataset.finalWidth * 1){
            el.style.width = el.dataset.finalWidth+'px';
            el.style.marginRight = -(el.dataset.finalWidth - el.dataset.interWidth)+(el.dataset.finalMarginRight * 1)+'px';
          }
          
          if(el.dataset.origHeight - el.dataset.finalHeight && el.dataset.finalHeight * 1){
            el.style.height = el.dataset.finalHeight+'px';
            el.style.marginBottom = -(el.dataset.finalHeight - el.dataset.interHeight)+(el.dataset.finalMarginBottom * 1) +'px';
          }
        }
      }
      
      if(self._changingClass){
        self._$container
          .removeClass(self.layout.containerClass)
          .addClass(self._newClass);
      }
      
      for(var i = 0; i < self._$toHide.length; i++){
        var el = self._$toHide[i],
          $el = $(el),
          delay = self._getDelay(i),
          toHideCSS = {};

        for(var j = 0; j<2; j++){
          var a = j === 0 ? a = self._prefix : '';

          toHideCSS[a+'transition-delay'] = delay+'ms';
          toHideCSS[a+'transform'] = self.effects.transformOut;
          toHideCSS.opacity = self.effects.opacity;
        }
        
        $el.css(self.effects.transition).css(toHideCSS);
      
        if(self.effects.transform || self.effects.opacity){
          self._bindTargetDone($el);
        };
      }
      
      self._execAction('_animateTargets', 1);

    },
    
    /**
     * Bind Targets TransitionEnd
     * @since 2.0.0
     * @param {object} $el
     */
    
    _bindTargetDone: function($el){
      var self = this,
        el = $el[0];
        
      self._execAction('_bindTargetDone', 0, arguments);
      
      if(!el.dataset.bound){
        
        el.dataset.bound = true;
        self._targetsBound++;
      
        $el.on('webkitTransitionEnd.mixItUp transitionend.mixItUp',function(e){
          if(
            (e.originalEvent.propertyName.indexOf('transform') > -1 || 
            e.originalEvent.propertyName.indexOf('opacity') > -1) &&
            $(e.originalEvent.target).is(self.selectors.target)
          ){
            $el.off('.mixItUp');
            delete el.dataset.bound;
            self._targetDone();
          }
        });
      }
      
      self._execAction('_bindTargetDone', 1, arguments);
    },
    
    /**
     * Target Done
     * @since 2.0.0
     */
    
    _targetDone: function(){
      var self = this;
      
      self._execAction('_targetDone', 0);
      
      self._targetsDone++;
      
      (self._targetsDone === self._targetsBound) && self._cleanUp();
      
      self._execAction('_targetDone', 1);
    },
    
    /**
     * Clean Up
     * @since 2.0.0
     */
    
    _cleanUp: function(){
      var self = this,
        targetStyles = self.animation.animateResizeTargets ? 'transform opacity width height margin-bottom margin-right' : 'transform opacity';
        unBrake = function(){
          self._$targets.removeStyle('transition', self._prefix);
        };
        
      self._execAction('_cleanUp', 0);
      
      !self._changingLayout ?
        self._$show.css('display',self.layout.display) :
        self._$show.css('display',self._newDisplay);
      
      self._$targets.css(self._brake);
      
      self._$targets
        .removeStyle(targetStyles, self._prefix)
        .removeAttr('data-inter-pos-x data-inter-pos-y data-final-pos-x data-final-pos-y data-orig-pos-x data-orig-pos-y data-orig-height data-orig-width data-final-height data-final-width data-inter-width data-inter-height data-orig-margin-right data-orig-margin-bottom data-inter-margin-right data-inter-margin-bottom data-final-margin-right data-final-margin-bottom');
        
      self._$hide.removeStyle('display');
      
      self._$parent.removeStyle('height transition perspective-distance perspective perspective-origin-x perspective-origin-y perspective-origin perspectiveOrigin', self._prefix);
      
      if(self._sorting){
        self._printSort();
        self._activeSort = self._newSortString;
        self._sorting = false;
      }
      
      if(self._changingLayout){
        if(self._changingDisplay){
          self.layout.display = self._newDisplay;
          self._changingDisplay = false;
        }
        
        if(self._changingClass){
          self._$parent.removeClass(self.layout.containerClass).addClass(self._newClass);
          self.layout.containerClass = self._newClass;
          self._changingClass = false;
        }
        
        self._changingLayout = false;
      }
      
      self._refresh();
      
      self._buildState();
      
      if(self._state.fail){
        self._$container.addClass(self.layout.containerClassFail);
      }
      
      self._$show = $();
      self._$hide = $();
      
      if(window.requestAnimationFrame){
        requestAnimationFrame(unBrake);
      }
      
      self._mixing = false;
      
      if(typeof self.callbacks._user === 'function'){
        self.callbacks._user.call(self._domNode, self._state, self);
      }
      
      if(typeof self.callbacks.onMixEnd === 'function'){
        self.callbacks.onMixEnd.call(self._domNode, self._state, self);
      }
      
      self._$container.trigger('mixEnd', [self._state, self]);
      
      if(self._state.fail){
        (typeof self.callbacks.onMixFail === 'function') && self.callbacks.onMixFail.call(self._domNode, self._state, self);
        self._$container.trigger('mixFail', [self._state, self]);
      }
      
      if(self._loading){
        (typeof self.callbacks.onMixLoad === 'function') && self.callbacks.onMixLoad.call(self._domNode, self._state, self);
        self._$container.trigger('mixLoad', [self._state, self]);
      }
      
      if(self._queue.length){
        self._execAction('_queue', 0);
        
        self.multiMix(self._queue[0][0],self._queue[0][1],self._queue[0][2]);
        self._queue.splice(0, 1);
      }
      
      self._execAction('_cleanUp', 1);
      
      self._loading = false;
    },
    
    /**
     * Get Prefixed CSS
     * @since 2.0.0
     * @param {string} property
     * @param {string} value
     * @param {boolean} prefixValue
     * @return {object} styles
     */
    
    _getPrefixedCSS: function(property, value, prefixValue){
      var self = this,
        styles = {},
        prefix = '',
        i = -1;
    
      for(i = 0; i < 2; i++){
        prefix = i === 0 ? self._prefix : '';
        prefixValue ? styles[prefix+property] = prefix+value : styles[prefix+property] = value;
      }
      
      return self._execFilter('_getPrefixedCSS', styles, arguments);
    },
    
    /**
     * Get Delay
     * @since 2.0.0
     * @param {number} i
     * @return {number} delay
     */
    
    _getDelay: function(i){
      var self = this,
        n = typeof self.animation.staggerSequence === 'function' ? self.animation.staggerSequence.call(self._domNode, i, self._state) : i,
        delay = self.animation.stagger ? n * self.animation.staggerDuration : 0;
        
      return self._execFilter('_getDelay', delay, arguments);
    },
    
    /**
     * Parse MultiMix Arguments
     * @since 2.0.0
     * @param {array} args
     * @return {object} output
     */
    
    _parseMultiMixArgs: function(args){
      var self = this,
        output = {
          command: null,
          animate: self.animation.enable,
          callback: null
        };
        
      for(var i = 0; i < args.length; i++){
        var arg = args[i];

        if(arg !== null){
          if(typeof arg === 'object' || typeof arg === 'string'){
            output.command = arg;
          } else if(typeof arg === 'boolean'){
            output.animate = arg;
          } else if(typeof arg === 'function'){
            output.callback = arg;
          }
        }
      }
      
      return self._execFilter('_parseMultiMixArgs', output, arguments);
    },
    
    /**
     * Parse Insert Arguments
     * @since 2.0.0
     * @param {array} args
     * @return {object} output
     */
    
    _parseInsertArgs: function(args){
      var self = this,
        output = {
          index: 0,
          $object: $(),
          multiMix: {filter: self._state.activeFilter},
          callback: null
        };
      
      for(var i = 0; i < args.length; i++){
        var arg = args[i];
        
        if(typeof arg === 'number'){
          output.index = arg;
        } else if(typeof arg === 'object' && arg instanceof $){
          output.$object = arg;
        } else if(typeof arg === 'object' && self._helpers._isElement(arg)){
          output.$object = $(arg);
        } else if(typeof arg === 'object' && arg !== null){
          output.multiMix = arg;
        } else if(typeof arg === 'boolean' && !arg){
          output.multiMix = false;
        } else if(typeof arg === 'function'){
          output.callback = arg;
        }
      }
      
      return self._execFilter('_parseInsertArgs', output, arguments);
    },
    
    /**
     * Execute Action
     * @since 2.0.0
     * @param {string} methodName
     * @param {boolean} isPost
     * @param {array} args
     */
    
    _execAction: function(methodName, isPost, args){
      var self = this,
        context = isPost ? 'post' : 'pre';

      if(!self._actions.isEmptyObject && self._actions.hasOwnProperty(methodName)){
        for(var key in self._actions[methodName][context]){
          self._actions[methodName][context][key].call(self, args);
        }
      }
    },
    
    /**
     * Execute Filter
     * @since 2.0.0
     * @param {string} methodName
     * @param {mixed} value
     * @return {mixed} value
     */
    
    _execFilter: function(methodName, value, args){
      var self = this;
      
      if(!self._filters.isEmptyObject && self._filters.hasOwnProperty(methodName)){
        for(var key in self._filters[methodName]){
          return self._filters[methodName][key].call(self, args);
        }
      } else {
        return value;
      }
    },
    
    /* Helpers
    ---------------------------------------------------------------------- */

    _helpers: {
      
      /**
       * CamelCase
       * @since 2.0.0
       * @param {string}
       * @return {string}
       */

      _camelCase: function(string){
        return string.replace(/-([a-z])/g, function(g){
            return g[1].toUpperCase();
        });
      },
      
      /**
       * Is Element
       * @since 2.1.3
       * @param {object} element to test
       * @return {boolean}
       */
      
      _isElement: function(el){
        if(window.HTMLElement){
          return el instanceof HTMLElement;
        } else {
          return (
            el !== null && 
            el.nodeType === 1 &&
            el.nodeName === 'string'
          );
        }
      }
    },
    
    /* Public Methods
    ---------------------------------------------------------------------- */
    
    /**
     * Is Mixing
     * @since 2.0.0
     * @return {boolean}
     */
    
    isMixing: function(){
      var self = this;
      
      return self._execFilter('isMixing', self._mixing);
    },
    
    /**
     * Filter (public)
     * @since 2.0.0
     * @param {array} arguments
     */
    
    filter: function(){
      var self = this,
        args = self._parseMultiMixArgs(arguments);

      self._clicking && (self._toggleString = '');
      
      self.multiMix({filter: args.command}, args.animate, args.callback);
    },
    
    /**
     * Sort (public)
     * @since 2.0.0
     * @param {array} arguments
     */
    
    sort: function(){
      var self = this,
        args = self._parseMultiMixArgs(arguments);

      self.multiMix({sort: args.command}, args.animate, args.callback);
    },

    /**
     * Change Layout (public)
     * @since 2.0.0
     * @param {array} arguments
     */
    
    changeLayout: function(){
      var self = this,
        args = self._parseMultiMixArgs(arguments);
        
      self.multiMix({changeLayout: args.command}, args.animate, args.callback);
    },
    
    /**
     * MultiMix
     * @since 2.0.0
     * @param {array} arguments
     */
    
    multiMix: function(){
      var self = this,
        args = self._parseMultiMixArgs(arguments);

      self._execAction('multiMix', 0, arguments);

      if(!self._mixing){
        if(self.controls.enable && !self._clicking){
          self.controls.toggleFilterButtons && self._buildToggleArray();
          self._updateControls(args.command, self.controls.toggleFilterButtons);
        }
        
        (self._queue.length < 2) && (self._clicking = false);
      
        delete self.callbacks._user;
        if(args.callback) self.callbacks._user = args.callback;
      
        var sort = args.command.sort,
          filter = args.command.filter,
          changeLayout = args.command.changeLayout;

        self._refresh();

        if(sort){
          self._newSort = self._parseSort(sort);
          self._newSortString = sort;
          
          self._sorting = true;
          self._sort();
        }
        
        if(filter !== undf){
          filter = (filter === 'all') ? self.selectors.target : filter;
  
          self._activeFilter = filter;
        }
        
        self._filter();
        
        if(changeLayout){
          self._newDisplay = (typeof changeLayout === 'string') ? changeLayout : changeLayout.display || self.layout.display;
          self._newClass = changeLayout.containerClass || '';

          if(
            self._newDisplay !== self.layout.display ||
            self._newClass !== self.layout.containerClass
          ){
            self._changingLayout = true;
            
            self._changingClass = (self._newClass !== self.layout.containerClass);
            self._changingDisplay = (self._newDisplay !== self.layout.display);
          }
        }
        
        self._$targets.css(self._brake);
        
        self._goMix(args.animate ^ self.animation.enable ? args.animate : self.animation.enable);
        
        self._execAction('multiMix', 1, arguments);
        
      } else {
        if(self.animation.queue && self._queue.length < self.animation.queueLimit){
          self._queue.push(arguments);
          
          (self.controls.enable && !self._clicking) && self._updateControls(args.command);
          
          self._execAction('multiMixQueue', 1, arguments);
          
        } else {
          if(typeof self.callbacks.onMixBusy === 'function'){
            self.callbacks.onMixBusy.call(self._domNode, self._state, self);
          }
          self._$container.trigger('mixBusy', [self._state, self]);
          
          self._execAction('multiMixBusy', 1, arguments);
        }
      }
    },
    
    /**
     * Insert
     * @since 2.0.0
     * @param {array} arguments
     */
    
    insert: function(){
      var self = this,
        args = self._parseInsertArgs(arguments),
        callback = (typeof args.callback === 'function') ? args.callback : null,
        frag = document.createDocumentFragment(),
        target = (function(){
          self._refresh();
          
          if(self._$targets.length){
            return (args.index < self._$targets.length || !self._$targets.length) ? 
              self._$targets[args.index] :
              self._$targets[self._$targets.length-1].nextElementSibling;
          } else {
            return self._$parent[0].children[0];
          }
        })();
            
      self._execAction('insert', 0, arguments);
        
      if(args.$object){
        for(var i = 0; i < args.$object.length; i++){
          var el = args.$object[i];
          
          frag.appendChild(el);
          frag.appendChild(document.createTextNode(' '));
        }

        self._$parent[0].insertBefore(frag, target);
      }
      
      self._execAction('insert', 1, arguments);
      
      if(typeof args.multiMix === 'object'){
        self.multiMix(args.multiMix, callback);
      }
    },

    /**
     * Prepend
     * @since 2.0.0
     * @param {array} arguments
     */
    
    prepend: function(){
      var self = this,
        args = self._parseInsertArgs(arguments);
        
      self.insert(0, args.$object, args.multiMix, args.callback);
    },
    
    /**
     * Append
     * @since 2.0.0
     * @param {array} arguments
     */
    
    append: function(){
      var self = this,
        args = self._parseInsertArgs(arguments);
    
      self.insert(self._state.totalTargets, args.$object, args.multiMix, args.callback);
    },
    
    /**
     * Get Option
     * @since 2.0.0
     * @param {string} string
     * @return {mixed} value
     */
    
    getOption: function(string){
      var self = this,
        getProperty = function(obj, prop){
          var parts = prop.split('.'),
            last = parts.pop(),
            l = parts.length,
            i = 1,
            current = parts[0] || prop;

          while((obj = obj[current]) && i < l){
            current = parts[i];
            i++;
          }

          if(obj !== undf){
            return obj[last] !== undf ? obj[last] : obj;
          }
        };

      return string ? self._execFilter('getOption', getProperty(self, string), arguments) : self;
    },
    
    /**
     * Set Options
     * @since 2.0.0
     * @param {object} config
     */
    
    setOptions: function(config){
      var self = this;
      
      self._execAction('setOptions', 0, arguments);
      
      typeof config === 'object' && $.extend(true, self, config);
      
      self._execAction('setOptions', 1, arguments);
    },
    
    /**
     * Get State
     * @since 2.0.0
     * @return {object} state
     */
    
    getState: function(){
      var self = this;
      
      return self._execFilter('getState', self._state, self);
    },
    
    /**
     * Force Refresh
     * @since 2.1.2
     */
    
    forceRefresh: function(){
      var self = this;
      
      self._refresh(false, true);
    },
    
    /**
     * Destroy
     * @since 2.0.0
     * @param {boolean} hideAll
     */
    
    destroy: function(hideAll){
      var self = this,
        filters = $.MixItUp.prototype._bound._filter,
        sorts = $.MixItUp.prototype._bound._sort;
      
      self._execAction('destroy', 0, arguments);
    
      self._$body
        .add($(self.selectors.sort))
        .add($(self.selectors.filter))
        .off('.mixItUp');
      
      for(var i = 0; i < self._$targets.length; i++){
        var target = self._$targets[i];

        hideAll && (target.style.display = '');

        delete target.mixParent;
      }
      
      self._execAction('destroy', 1, arguments);

      if(filters[self.selectors.filter] && filters[self.selectors.filter] > 1) {
        filters[self.selectors.filter]--;
      } else if(filters[self.selectors.filter] === 1) {
        delete filters[self.selectors.filter];
      }

      if(sorts[self.selectors.sort] && sorts[self.selectors.sort] > 1) {
        sorts[self.selectors.sort]--;
      } else if(sorts[self.selectors.sort] === 1) {
        delete sorts[self.selectors.sort];
      }

      delete $.MixItUp.prototype._instances[self._id];
    }
    
  };
  
  /* jQuery Methods
  ---------------------------------------------------------------------- */
  
  /**
   * jQuery .mixItUp() method
   * @since 2.0.0
   * @extends $.fn
   */
  
  $.fn.mixItUp = function(){
    var args = arguments,
      dataReturn = [],
      eachReturn,
      _instantiate = function(domNode, settings){
        var instance = new $.MixItUp(),
          rand = function(){
            return ('00000'+(Math.random()*16777216<<0).toString(16)).substr(-6).toUpperCase();
          };
          
        instance._execAction('_instantiate', 0, arguments);

        domNode.id = !domNode.id ? 'MixItUp'+rand() : domNode.id;
        
        if(!instance._instances[domNode.id]){
          instance._instances[domNode.id] = instance;
          instance._init(domNode, settings);
        }
        
        instance._execAction('_instantiate', 1, arguments);
      };
      
    eachReturn = this.each(function(){
      if(args && typeof args[0] === 'string'){
        var instance = $.MixItUp.prototype._instances[this.id];
        if(args[0] === 'isLoaded'){
          dataReturn.push(instance ? true : false);
        } else {
          var data = instance[args[0]](args[1], args[2], args[3]);
          if(data !== undf)dataReturn.push(data);
        }
      } else {
        _instantiate(this, args[0]);
      }
    });
    
    if(dataReturn.length){
      return dataReturn.length > 1 ? dataReturn : dataReturn[0];
    } else {
      return eachReturn;
    }
  };
  
  /**
   * jQuery .removeStyle() method
   * @since 2.0.0
   * @extends $.fn
   */
  
  $.fn.removeStyle = function(style, prefix){
    prefix = prefix ? prefix : '';
  
    return this.each(function(){
      var el = this,
        styles = style.split(' ');
        
      for(var i = 0; i < styles.length; i++){
        for(var j = 0; j < 4; j++){
          switch (j) {
            case 0:
              var prop = styles[i];
              break;
            case 1:
              var prop = $.MixItUp.prototype._helpers._camelCase(prop);
              break;
            case 2:
              var prop = prefix+styles[i];
              break;
            case 3:
              var prop = $.MixItUp.prototype._helpers._camelCase(prefix+styles[i]);
          }
          
          if(
            el.style[prop] !== undf && 
            typeof el.style[prop] !== 'unknown' &&
            el.style[prop].length > 0
          ){
            el.style[prop] = '';
          }
          
          if(!prefix && j === 1)break;
        }
      }
      
      if(el.attributes && el.attributes.style && el.attributes.style !== undf && el.attributes.style.value === ''){
        el.attributes.removeNamedItem('style');
      }
    });
  };
  
})(jQuery);