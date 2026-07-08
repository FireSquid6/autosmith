/**
 * src/system.ts — the system-resources DTO reported by a ship's
 * `GET /system-resources` route (and re-exposed/aggregated by the bridge).
 *
 * A plain interface (like `WorkspaceStatus`): it travels over the typed Eden
 * HTTP surface, so — unlike the `/events` payloads — no third party decodes it
 * from a raw string and it needs no zod schema.
 */

/** A point-in-time snapshot of a host's system resources. */
export interface SystemResources {
  /** System uptime in seconds (`os.uptime()`). */
  readonly uptimeSeconds: number;
  readonly os: {
    /** Operating system name, e.g. "Linux" / "Darwin" (`os.type()`). */
    readonly type: string;
    /** Platform, e.g. "linux" / "darwin" (`os.platform()`). */
    readonly platform: string;
    /** OS release / kernel version (`os.release()`). */
    readonly release: string;
    /** Kernel version string (`os.version()`). */
    readonly version: string;
    /** Node/Bun arch, e.g. "x64" / "arm64" (`os.arch()`). */
    readonly arch: string;
    /** Machine hardware name, e.g. "x86_64" / "aarch64" (`os.machine()`). */
    readonly machine: string;
    /** Host name (`os.hostname()`). */
    readonly hostname: string;
  };
  readonly cpu: {
    /** CPU model of the first core (`os.cpus()[0].model`). */
    readonly model: string;
    /** Number of logical cores (`os.cpus().length`). */
    readonly cores: number;
    /** Fraction (0..1) of CPU time spent busy across all cores, sampled briefly. */
    readonly usage: number;
    /** 1/5/15-minute load averages (`os.loadavg()`; all 0 on unsupported platforms). */
    readonly loadAverage: readonly [number, number, number];
  };
  readonly memory: {
    /** Total physical memory in bytes (`os.totalmem()`). */
    readonly total: number;
    /** Free physical memory in bytes (`os.freemem()`). */
    readonly free: number;
    /** Used physical memory in bytes (`total - free`). */
    readonly used: number;
    /** Fraction (0..1) of physical memory in use (`used / total`). */
    readonly usage: number;
  };
}
