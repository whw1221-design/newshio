import { parseId } from '../utils/validation.js';

function parseParam(getRaw, key, label) {
  return (req, res, next) => {
    try {
      req[key] = parseId(getRaw(req), label);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const productIdParam = parseParam(
  (req) => req.params.id,
  'productId',
  'product id',
);

export const userIdParam = parseParam((req) => req.params.id, 'userId', 'user id');

export const orderIdParam = parseParam(
  (req) => req.params.id,
  'orderId',
  'order id',
);

/** For /get_orders/uid/:uid */
export const orderUserParam = parseParam(
  (req) => req.params.uid,
  'userId',
  'user id',
);

/** For /get_orders/pid/:pid */
export const orderProductParam = parseParam(
  (req) => req.params.pid,
  'productId',
  'product id',
);
