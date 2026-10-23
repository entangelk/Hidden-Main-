// Scenarios listed in main.py, in this order (SoT §3.7).
import type { Scenario } from '../engine/types'
import { incident0214 } from './incident-0214'
import { thermalDrift } from './thermal-drift'
import { unloggedRun } from './unlogged-run'

export const scenarios: Scenario[] = [incident0214, thermalDrift, unloggedRun]
