/*
 *
 * https://github.com/fatlinesofcode/ngDraggable
 */
angular.module("ngDraggable", [])
    .directive('ngDrag', ['$rootScope', '$parse', function ($rootScope, $parse) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                scope.value = attrs.ngDrag;
                //  return;
                var offset, _centerAnchor = false, _mx, _my, _tx, _ty, _mrx, _mry;
                var startOffsetY, startMouseY, offsetX;
                var _hasTouch = ('ontouchstart' in document.documentElement);
                var _pressEvents = 'touchstart mousedown';
                var _moveEvents = 'touchmove mousemove';
                var _releaseEvents = 'touchend mouseup';

                var $document = $(document);
                var $window = $(window);
                var _data = null;

                var _dragEnabled = false;

                var _pressTimer = null;

                var onDragSuccessCallback = $parse(attrs.ngDragSuccess) || null;

                var initialize = function () {
                    element.attr('draggable', 'false'); // prevent native drag
                    toggleListeners(true);
                };

                var toggleListeners = function (enable) {
                    // remove listeners

                    if (!enable)return;
                    // add listeners.

                    scope.$on('$destroy', onDestroy);
                    //attrs.$observe("ngDrag", onEnableChange);
                    scope.$watch(attrs.ngDrag, onEnableChange);
                    //attrs.$observe('ngCenterAnchor', onCenterAnchor);
                    scope.$watch(attrs.ngCenterAnchor, onCenterAnchor);
                    scope.$watch(attrs.ngDragData, onDragDataChange);
                    element.on(_pressEvents, onpress);
                    if (!_hasTouch) {
                        element.on('mousedown', function () {
                            return false;
                        }); // prevent native drag
                    }
                };
                var onDestroy = function (enable) {
                    toggleListeners(false);
                };
                var onDragDataChange = function (newVal, oldVal) {
                    _data = newVal;
                };
                var onEnableChange = function (newVal, oldVal) {
                    _dragEnabled = (newVal);
                };
                var onCenterAnchor = function (newVal, oldVal) {
                    if (angular.isDefined(newVal))
                        _centerAnchor = (newVal || 'true');
                }
                /*
                 * When the element is clicked start the drag behaviour
                 * On touch devices as a small delay so as not to prevent native window scrolling
                 */
                var onpress = function (evt) {
                    if (!_dragEnabled)return;


                    if (_hasTouch) {
                        cancelPress();
                        _pressTimer = setTimeout(function () {
                            cancelPress();
                            onlongpress(evt);
                        }, 100);
                        $document.on(_moveEvents, cancelPress);
                        $document.on(_releaseEvents, cancelPress);
                    } else {


                        cancelPress();
                        _pressTimer = setTimeout(function () {
                            cancelPress();
                            onlongpress(evt);
                        }, 200);
                        $document.on(_moveEvents, cancelPress);
                        $document.on(_releaseEvents, cancelPress);


                    }

                }
                var cancelPress = function () {
                    clearTimeout(_pressTimer);
                    $document.off(_moveEvents, cancelPress);
                    $document.off(_releaseEvents, cancelPress);
                }

                function calculateDistance(elem, mouseY) {
                    return mouseY - (elem.offset().top);
                }

                var onlongpress = function (evt) {

                    if (!_dragEnabled)return;
                    evt.preventDefault();
                    element = jQuery(element);

                    var table = $('#configuration-table');

                    offset = element.offset();

                    var prevClonedItem = $('#cloned_item');
                    if (prevClonedItem) {
                        prevClonedItem.remove();
                    }

                    var item = element.clone().attr("id", "cloned_item").appendTo(table);
                    element = item;

                    _mx = (evt.pageX || evt.originalEvent.touches[0].pageX);
                    _my = (evt.pageY || evt.originalEvent.touches[0].pageY);

                    element.addClass('dragging');
                    startMouseY = _my;

                    var parentPos = table.offset();
                    var childOffset = {
                        top: offset.top - parentPos.top,
                        left: offset.left - parentPos.left
                    }

                    //childOffset.top = calculateDistance(table, _my) + 15;
                    if (childOffset.top < 0) {
                        childOffset.top = calculateDistance(table, _my);
                    }
                    if (childOffset.left < 0) {
                        childOffset.left = 0;
                    }

                    startOffsetY = childOffset.top;
                    offsetX = childOffset.left;

                    _tx = offsetX;
                    _ty = childOffset.top;

                    moveElement(_tx, _ty);
                    $document.on(_moveEvents, onmove);
                    $document.on(_releaseEvents, onrelease);
                    $rootScope.$broadcast('draggable:start', {x: _mx, y: _my, tx: _tx, ty: _ty, event: evt, element: element, data: _data});

                }
                var onmove = function (evt) {

                    if (!_dragEnabled)return;
                    evt.preventDefault();

                    _mx = (evt.pageX || evt.originalEvent.touches[0].pageX);
                    _my = (evt.pageY || evt.originalEvent.touches[0].pageY);

                    var yDiff = startMouseY - _my;
                    _tx = offsetX;
                    _ty = startOffsetY - yDiff;

                    moveElement(_tx, _ty);

                    $rootScope.$broadcast('draggable:move', {x: _mx, y: _my, tx: _tx, ty: _ty, event: evt, element: element, data: _data});

                }
                var onrelease = function (evt) {

                    var prevClonedItem = document.getElementById('cloned_item');
                    if (document.getElementById('cloned_item')) {
                        prevClonedItem.remove();
                    }

                    if (!_dragEnabled)return;
                    evt.preventDefault();
                    $rootScope.$broadcast('draggable:end', {x: _mx, y: _my, tx: _tx, ty: _ty, event: evt, element: element, data: _data, callback: onDragComplete});
                    element.removeClass('dragging');

                    reset();
                    $document.off(_moveEvents, onmove);
                    $document.off(_releaseEvents, onrelease);

                }
                var onDragComplete = function (evt) {

                    if (!onDragSuccessCallback)return;

                    scope.$apply(function () {
                        onDragSuccessCallback(scope, {$data: _data, $event: evt});
                    });
                }
                var reset = function () {
                    element.css({left: '', top: '', position: '', 'z-index': '', margin: ''});
                }
                var moveElement = function (x, y) {
                    element.css({left: x, top: y, position: 'absolute', 'z-index': 99999, margin: '0'});
                }
                initialize();
            }
        }
    }])
    .directive('ngDrop', ['$parse', '$timeout', function ($parse, $timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                scope.value = attrs.ngDrop;

                var _dropEnabled = false;

                var onDropCallback = $parse(attrs.ngDropSuccess);// || function(){};
                var initialize = function () {
                    toggleListeners(true);
                };


                var toggleListeners = function (enable) {
                    // remove listeners

                    if (!enable)return;
                    // add listeners.
                    attrs.$observe("ngDrop", onEnableChange);
                    scope.$on('$destroy', onDestroy);
                    //scope.$watch(attrs.uiDraggable, onDraggableChange);
                    scope.$on('draggable:start', onDragStart);
                    scope.$on('draggable:move', onDragMove);
                    scope.$on('draggable:end', onDragEnd);
                };
                var onDestroy = function (enable) {
                    toggleListeners(false);
                };
                var onEnableChange = function (newVal, oldVal) {
                    _dropEnabled = scope.$eval(newVal);
                }
                var onDragStart = function (evt, obj) {
                    if (!_dropEnabled)return;
                    isTouching(obj.x, obj.y, obj.element);
                }
                var onDragMove = function (evt, obj) {
                    if (!_dropEnabled)return;


                    isTouching(obj.x, obj.y, obj.element);
                }
                var onDragEnd = function (evt, obj) {
                    if (!_dropEnabled)return;
                    if (isTouching(obj.x, obj.y, obj.element)) {
                        // call the ngDraggable ngDragSuccess element callback
                        if (obj.callback) {
                            obj.callback(obj);
                        }

                        // call the ngDrop element callback
                        //   scope.$apply(function () {
                        //       onDropCallback(scope, {$data: obj.data, $event: evt});
                        //   });
                        $timeout(function () {
                            onDropCallback(scope, {$data: obj.data, $event: obj});
                        });


                    }
                    updateDragStyles(false, obj.element);
                }
                var isTouching = function (mouseX, mouseY, dragElement) {
                    var touching = hitTest(mouseX, mouseY);
                    updateDragStyles(touching, dragElement);
                    return touching;
                }
                var updateDragStyles = function (touching, dragElement) {
                    if (touching) {
                        element.addClass('drag-enter');
                        dragElement.addClass('drag-over');
                    } else {
                        element.removeClass('drag-enter');
                        dragElement.removeClass('drag-over');
                    }
                }
                var hitTest = function (x, y) {
                    element = jQuery(element);
                    var bounds = element.offset();
                    bounds.right = bounds.left + element.outerWidth();
                    bounds.bottom = bounds.top + element.outerHeight();
                    return x >= bounds.left
                        && x <= bounds.right
                        && y <= bounds.bottom
                        && y >= bounds.top;
                }

                initialize();
            }
        }
    }])
    .directive('ngDragClone', ['$parse', '$timeout', function ($parse, $timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var img, _allowClone = true;
                scope.clonedData = {};
                var initialize = function () {
                    img = $(element.find('img'));
                    element.attr('draggable', 'false');
                    img.attr('draggable', 'false');
                    reset();
                    toggleListeners(true);
                };


                var toggleListeners = function (enable) {
                    // remove listeners

                    if (!enable)return;
                    // add listeners.
                    scope.$on('draggable:start', onDragStart);
                    scope.$on('draggable:move', onDragMove);
                    scope.$on('draggable:end', onDragEnd);
                    preventContextMenu();

                };
                var preventContextMenu = function () {
                    //  element.off('mousedown touchstart touchmove touchend touchcancel', absorbEvent_);
                    img.off('mousedown touchstart touchmove touchend touchcancel', absorbEvent_);
                    //  element.on('mousedown touchstart touchmove touchend touchcancel', absorbEvent_);
                    img.on('mousedown touchstart touchmove touchend touchcancel', absorbEvent_);
                }
                var onDragStart = function (evt, obj, elm) {
                    _allowClone = true
                    if (angular.isDefined(obj.data.allowClone)) {
                        _allowClone = obj.data.allowClone;
                    }
                    if (_allowClone) {
                        scope.$apply(function () {
                            scope.clonedData = obj.data;
                        });
                        element.css('width', obj.element.width());
                        element.css('height', obj.element.height());

                        moveElement(obj.tx, obj.ty);
                    }
                }
                var onDragMove = function (evt, obj) {
                    if (_allowClone) {
                        moveElement(obj.tx, obj.ty);
                    }
                }
                var onDragEnd = function (evt, obj) {
                    //moveElement(obj.tx,obj.ty);
                    if (_allowClone) {
                        reset();
                    }
                }

                var reset = function () {
                    element.css({left: 0, top: 0, position: 'absolute', 'z-index': -1, visibility: 'hidden'});
                }
                var moveElement = function (x, y) {
                    element.css({left: x, top: y, position: 'absolute', 'z-index': 99999, visibility: 'visible'});
                }

                var absorbEvent_ = function (event) {
                    var e = event.originalEvent;
                    e.preventDefault && e.preventDefault();
                    e.stopPropagation && e.stopPropagation();
                    e.cancelBubble = true;
                    e.returnValue = false;
                    return false;
                }

                initialize();
            }
        }
    }])
    .directive('ngPreventDrag', ['$parse', '$timeout', function ($parse, $timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var initialize = function () {

                    element.attr('draggable', 'false');
                    toggleListeners(true);
                };


                var toggleListeners = function (enable) {
                    // remove listeners

                    if (!enable)return;
                    // add listeners.
                    element.on('mousedown touchstart touchmove touchend touchcancel', absorbEvent_);
                };


                var absorbEvent_ = function (event) {
                    var e = event.originalEvent;
                    e.preventDefault && e.preventDefault();
                    e.stopPropagation && e.stopPropagation();
                    e.cancelBubble = true;
                    e.returnValue = false;
                    return false;
                }

                initialize();
            }
        }
    }]);