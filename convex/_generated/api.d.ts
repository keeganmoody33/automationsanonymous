/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_automations from "../admin/automations.js";
import type * as admin_imports from "../admin/imports.js";
import type * as admin_tools from "../admin/tools.js";
import type * as lib_adminAuth from "../lib/adminAuth.js";
import type * as lib_limits from "../lib/limits.js";
import type * as lib_publicShape from "../lib/publicShape.js";
import type * as lib_published from "../lib/published.js";
import type * as lib_toolShape from "../lib/toolShape.js";
import type * as lib_validators from "../lib/validators.js";
import type * as public_automations from "../public/automations.js";
import type * as public_stacks from "../public/stacks.js";
import type * as public_tools from "../public/tools.js";
import type * as submit from "../submit.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/automations": typeof admin_automations;
  "admin/imports": typeof admin_imports;
  "admin/tools": typeof admin_tools;
  "lib/adminAuth": typeof lib_adminAuth;
  "lib/limits": typeof lib_limits;
  "lib/publicShape": typeof lib_publicShape;
  "lib/published": typeof lib_published;
  "lib/toolShape": typeof lib_toolShape;
  "lib/validators": typeof lib_validators;
  "public/automations": typeof public_automations;
  "public/stacks": typeof public_stacks;
  "public/tools": typeof public_tools;
  submit: typeof submit;
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
