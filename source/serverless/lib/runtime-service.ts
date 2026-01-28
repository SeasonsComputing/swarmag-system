/**
 * Service runtime selector for Netlify Edge or Deno.
 *
 * Chooses the runtime once and delegates init/get calls.
 */

import type { RuntimeEnv } from '@utils/runtime-env.ts'
import { DenoEnv } from './runtime-deno.ts'
import { NetlifyEnv } from './runtime-netlify.ts'

type NetlifyRuntime = {
  env: {
    get: (name: string) => string | undefined
  }
}

type RuntimeEnvClass = typeof DenoEnv | typeof NetlifyEnv

export class ServiceEnv {
  static #delegate: RuntimeEnvClass | null = null

  /**
   * Register and validate required runtime parameters.
   * @param required - Parameter names that must be present.
   */
  static init(required: readonly string[]): void {
    ServiceEnv.#resolve().init(required)
  }

  /**
   * Return a validated runtime parameter value.
   * @param name - Parameter name to read.
   */
  static get(name: string): string {
    return ServiceEnv.#resolve().get(name)
  }

  /**
   * Resolve the delegate runtime for the current environment.
   */
  static #resolve(): RuntimeEnvClass {
    if (ServiceEnv.#delegate) return ServiceEnv.#delegate
    const netlify = (globalThis as { Netlify?: NetlifyRuntime }).Netlify
    ServiceEnv.#delegate = netlify?.env?.get ? NetlifyEnv : DenoEnv
    return ServiceEnv.#delegate
  }
}

const isValid: RuntimeEnv = ServiceEnv
