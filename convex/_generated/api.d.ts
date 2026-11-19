/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as dashboard from "../dashboard.js";
import type * as event from "../event.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as payments from "../payments.js";
import type * as payments_mutations from "../payments/mutations.js";
import type * as payments_subscriptions from "../payments/subscriptions.js";
import type * as payments_verification from "../payments/verification.js";
import type * as payments_webhooks from "../payments/webhooks.js";
import type * as registrations from "../registrations.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  dashboard: typeof dashboard;
  event: typeof event;
  events: typeof events;
  http: typeof http;
  payments: typeof payments;
  "payments/mutations": typeof payments_mutations;
  "payments/subscriptions": typeof payments_subscriptions;
  "payments/verification": typeof payments_verification;
  "payments/webhooks": typeof payments_webhooks;
  registrations: typeof registrations;
  search: typeof search;
  seed: typeof seed;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
