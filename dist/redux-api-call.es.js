import _defineProperty from 'babel-runtime/helpers/defineProperty';
import _regeneratorRuntime from 'babel-runtime/regenerator';
import _asyncToGenerator from 'babel-runtime/helpers/asyncToGenerator';
import _extends from 'babel-runtime/helpers/extends';
import dedupe from 'redux-api-call-adapter-dedupe';
import fetch from 'redux-api-call-adapter-fetch';
import json from 'redux-api-call-adapter-json';
import _Object$keys from 'babel-runtime/core-js/object/keys';

var REDUCER_PATH = 'api_calls';
var ACTION_FETCH_START = '@@api/FETCH_START';
var ACTION_FETCH_COMPLETE = '@@api/FETCH_COMPLETE';
var ACTION_FETCH_FAILURE = '@@api/FETCH_FAILURE';
var ACTION_UPDATE_LOCAL = '@@api/UPDATE_LOCAL';
var ACTION_RESET_LOCAL = '@@api/RESET_LOCAL';

var makeStartErrorAction = function makeStartErrorAction(payload) {
  return {
    type: ACTION_FETCH_START,
    error: true,
    payload: payload
  };
};



var makeSuccessAction = function makeSuccessAction(api, _ref) {
  var payload = _ref.payload,
      meta = _ref.meta;
  return {
    type: ACTION_FETCH_COMPLETE,
    payload: _extends({}, api, {
      json: payload,
      respondedAt: Date.now()
    }),
    meta: meta
  };
};

var makeFailureAction = function makeFailureAction(api, _ref2) {
  var payload = _ref2.payload,
      meta = _ref2.meta,
      statusCode = _ref2.statusCode;
  return {
    type: ACTION_FETCH_FAILURE,
    payload: _extends({}, api, {
      json: payload,
      statusCode: statusCode,
      respondedAt: Date.now()
    }),
    meta: meta
  };
};

var reduceKeys = function reduceKeys(obj) {
  return function (reducer, seed) {
    return _Object$keys(obj).reduce(function (acc, key) {
      return _extends({}, acc, reducer(obj, key));
    }, seed);
  };
};

var bindFunction = function bindFunction(getState) {
  return function (obj, key) {
    return _defineProperty({}, key, typeof obj[key] === 'function' ? obj[key](getState()) : obj[key]);
  };
};

var applyFunctions = (function (getState) {
  return function (api) {
    return reduceKeys(api)(bindFunction(getState), {});
  };
});

var compose$1 = function compose() {
  for (var _len = arguments.length, adapters = Array(_len), _key = 0; _key < _len; _key++) {
    adapters[_key] = arguments[_key];
  }

  if (adapters.length === 0) {
    throw new Error('redux-api-call: composeAdatpers must take at least one adapter');
  }
  var reversed = adapters.reverse();
  var head = reversed[0];
  var tail = reversed.slice(1);

  return function (getState) {
    return tail.reduce(function (acc, current) {
      return current(acc, getState);
    }, head(function (x) {
      return x;
    }, getState));
  };
};

var tryRequest = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(request, adapter) {
    var response;
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return adapter(request);

          case 3:
            response = _context.sent;
            return _context.abrupt('return', makeSuccessAction(request, response));

          case 7:
            _context.prev = 7;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', makeFailureAction(request, _context.t0));

          case 10:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[0, 7]]);
  }));

  return function tryRequest(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var defaultAdapter = compose$1(json, dedupe, fetch);

function validate(request) {
  if (typeof request.name !== 'string') {
    return makeStartErrorAction(_extends({}, request, {
      error: 'no api name is specified'
    }));
  }
  if (typeof request.endpoint !== 'string') {
    return makeStartErrorAction(_extends({}, request, {
      error: 'no api endpoint is specified'
    }));
  }
  return false;
}

function createAPIMiddleware(adapter) {
  var _this = this;

  return function (_ref2) {
    var dispatch = _ref2.dispatch,
        getState = _ref2.getState;

    var finalAdapter = adapter(getState);
    var resolveState = applyFunctions(getState);

    return function (next) {
      return function () {
        var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(action) {
          var request, errorAction;
          return _regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  request = void 0;

                  if (!(action.type === ACTION_FETCH_START)) {
                    _context2.next = 7;
                    break;
                  }

                  request = resolveState(action.payload);

                  errorAction = validate(request);

                  if (!errorAction) {
                    _context2.next = 7;
                    break;
                  }

                  next(errorAction);
                  return _context2.abrupt('return');

                case 7:

                  if (request) {
                    next(_extends({}, action, { payload: request }));
                  } else {
                    next(action);
                  }

                  if (!(action.type !== ACTION_FETCH_START)) {
                    _context2.next = 10;
                    break;
                  }

                  return _context2.abrupt('return');

                case 10:
                  _context2.t0 = dispatch;
                  _context2.next = 13;
                  return tryRequest(request, finalAdapter);

                case 13:
                  _context2.t1 = _context2.sent;
                  (0, _context2.t0)(_context2.t1);

                case 15:
                case 'end':
                  return _context2.stop();
              }
            }
          }, _callee2, _this);
        }));

        return function (_x3) {
          return _ref3.apply(this, arguments);
        };
      }();
    };
  };
}

var middleware = createAPIMiddleware(defaultAdapter);

var get = (function (array, defaulValue) {
  return function (state) {
    var finalValue = array.reduce(function (value, nextProp) {
      if (typeof value === 'undefined' || value === null) {
        return;
      }
      return value[nextProp];
    }, state);

    if (typeof finalValue === 'undefined') {
      return defaulValue;
    }

    return finalValue;
  };
});

var normalizeResetData = function normalizeResetData() {
  var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ['lastRequest', 'isFetching', 'isInvalidated', 'lastResponse', 'data', 'error'];

  if (typeof data === 'string') {
    return [data];
  }
  if (!Array.isArray(data)) {
    throw new Error('You are using resetter wrong, the params should be string, array or undefined');
  }
  return data;
};

var makeFetchAction = (function (apiName, apiConfigFn) {
  var selectorDescriptor = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var actionCreator = function actionCreator() {
    return {
      type: ACTION_FETCH_START,
      payload: _extends({}, apiConfigFn.apply(undefined, arguments), {
        name: apiName,
        requestedAt: Date.now()
      })
    };
  };

  var updater = function updater(data) {
    return {
      type: ACTION_UPDATE_LOCAL,
      payload: {
        name: apiName,
        data: data
      }
    };
  };

  var resetter = function resetter(data) {
    return {
      type: ACTION_RESET_LOCAL,
      payload: {
        name: apiName,
        data: normalizeResetData(data)
      }
    };
  };

  var isFetchingSelector = get([REDUCER_PATH, apiName, 'isFetching'], false);
  var isInvalidatedSelector = get([REDUCER_PATH, apiName, 'isInvalidated'], false);
  var dataSelector = get([REDUCER_PATH, apiName, 'data'], null);
  var headersSelector = get([REDUCER_PATH, apiName, 'headers'], null);
  var errorSelector = get([REDUCER_PATH, apiName, 'error'], null);
  var lastResponseSelector = get([REDUCER_PATH, apiName, 'lastResponse'], null);

  return {
    actionCreator: actionCreator,
    updater: updater,
    isFetchingSelector: isFetchingSelector,
    isInvalidatedSelector: isInvalidatedSelector,
    dataSelector: dataSelector,
    headersSelector: headersSelector,
    errorSelector: errorSelector,
    lastResponseSelector: lastResponseSelector,
    resetter: resetter
  };
});

var handleActions = (function (handlers) {
  return function () {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var action = arguments[1];

    var handler = handlers[action.type];
    if (typeof handler !== 'function') {
      return state;
    }

    return handler(state, action);
  };
});

var _handleActions;

var getName = function getName(action) {
  return action.payload.name;
};
var getRequestedAt = function getRequestedAt(action) {
  return action.payload.requestedAt;
};
var getRespondedAt = function getRespondedAt(action) {
  return action.payload.respondedAt;
};
var getJSONResponse = function getJSONResponse(action) {
  return action.payload.json;
};
var getError = function getError(action) {
  return action.payload.error;
};
var getPreviousError = function getPreviousError(state, action) {
  return state[getName(action)] ? state[getName(action)].error : null;
};

var includeString = function includeString(element, array) {
  return array.indexOf(element) !== -1;
};
var resetOrKeepValue = function resetOrKeepValue(field, action, currentData) {
  return includeString(field, action.payload.data) ? undefined : currentData[field];
};

var updateWith = function updateWith(state, name, obj) {
  return _extends({}, state, _defineProperty({}, name, _extends({}, state[name], obj)));
};

var reducer = handleActions((_handleActions = {}, _defineProperty(_handleActions, ACTION_FETCH_START, function (state, action) {
  return updateWith(state, getName(action), {
    lastRequest: getRequestedAt(action),
    isFetching: !action.error,
    isInvalidated: true,
    error: action.error ? getError(action) : getPreviousError(state, action)
  });
}), _defineProperty(_handleActions, ACTION_FETCH_COMPLETE, function (state, action) {
  return updateWith(state, getName(action), {
    isFetching: false,
    isInvalidated: false,
    lastResponse: getRespondedAt(action),
    data: getJSONResponse(action),
    error: null,
    headers: action.meta
  });
}), _defineProperty(_handleActions, ACTION_FETCH_FAILURE, function (state, action) {
  return updateWith(state, getName(action), {
    isFetching: false,
    isInvalidated: true,
    error: getJSONResponse(action),
    headers: action.meta
  });
}), _defineProperty(_handleActions, ACTION_UPDATE_LOCAL, function (state, action) {
  return updateWith(state, getName(action), {
    data: action.payload.data
  });
}), _defineProperty(_handleActions, ACTION_RESET_LOCAL, function (state, action) {
  var name = getName(action);
  var currentData = state[name] || {};
  return updateWith(state, name, {
    lastRequest: resetOrKeepValue('lastRequest', action, currentData),
    isFetching: resetOrKeepValue('isFetching', action, currentData),
    isInvalidated: resetOrKeepValue('isInvalidated', action, currentData),
    lastResponse: resetOrKeepValue('lastResponse', action, currentData),
    data: resetOrKeepValue('data', action, currentData),
    error: resetOrKeepValue('error', action, currentData)
  });
}), _handleActions));

var reducers = _defineProperty({}, REDUCER_PATH, reducer);
var ACTIONS = {
  START: ACTION_FETCH_START,
  COMPLETE: ACTION_FETCH_COMPLETE,
  FAILURE: ACTION_FETCH_FAILURE,
  UPDATE_LOCAL: ACTION_UPDATE_LOCAL
};

var defaultTransformers = [dedupe, json, fetch];

export { defaultTransformers, middleware, makeFetchAction, reducers, ACTIONS, compose$1 as composeAdapters, createAPIMiddleware };
