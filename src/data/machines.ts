import type { GymMachine, MachineId, MachineRegion } from '../types';

function machine(
  id: MachineId,
  displayName: string,
  region: MachineRegion,
  aliases: readonly string[],
  exerciseIds: readonly string[],
  emphasis: GymMachine['emphasis'],
  alt: string,
): GymMachine {
  return {
    id,
    displayName,
    imagePath: `/machines/${id}.png`,
    region,
    aliases,
    exerciseIds,
    emphasis,
    alt,
    enabled: true,
    alternatives: [],
  };
}

/**
 * The confirmed equipment at this gym.
 *
 * Percentages are rounded training-emphasis estimates for planning, not EMG,
 * force, or hypertrophy measurements. Every distribution sums to 100 so the
 * bars can be compared within one machine without implying laboratory precision.
 */
export const MACHINES = [
  machine(
    'G3-S10',
    'Chest Press',
    'Chest',
    ['chest press', 'machine chest press'],
    ['machine-chest-press'],
    [
      { muscle: 'Chest', percent: 55, role: 'primary' },
      { muscle: 'Triceps', percent: 25, role: 'secondary' },
      { muscle: 'Front delts', percent: 20, role: 'secondary' },
    ],
    'Chest press machine with a seated pressing station and weight stack',
  ),
  machine(
    'G3-S12',
    'Pectoral Fly',
    'Chest',
    ['pec fly', 'pectoral fly', 'machine fly', 'machine chest fly'],
    ['machine-pectoral-fly'],
    [
      { muscle: 'Chest', percent: 80, role: 'primary' },
      { muscle: 'Front delts', percent: 15, role: 'secondary' },
      { muscle: 'Arm stabilisers', percent: 5, role: 'secondary' },
    ],
    'Pectoral fly machine with two padded movement arms and a weight stack',
  ),
  machine(
    'G3-S20',
    'Shoulder Press',
    'Shoulders',
    ['shoulder press', 'machine shoulder press'],
    ['machine-shoulder-press'],
    [
      { muscle: 'Front delts', percent: 45, role: 'primary' },
      { muscle: 'Side delts', percent: 25, role: 'primary' },
      { muscle: 'Triceps', percent: 20, role: 'secondary' },
      { muscle: 'Upper traps', percent: 5, role: 'secondary' },
      { muscle: 'Upper chest', percent: 5, role: 'secondary' },
    ],
    'Shoulder press machine with an upright seat and overhead press arms',
  ),
  machine(
    'G3-S21',
    'Lateral Raise',
    'Shoulders',
    ['machine lateral raise', 'lateral raise machine'],
    ['machine-lateral-raise'],
    [
      { muscle: 'Side delts', percent: 65, role: 'primary' },
      { muscle: 'Front delts', percent: 10, role: 'secondary' },
      { muscle: 'Upper traps', percent: 10, role: 'secondary' },
      { muscle: 'Rotator cuff', percent: 10, role: 'secondary' },
      { muscle: 'Rear delts', percent: 5, role: 'secondary' },
    ],
    'Lateral raise machine with arm pads beside an upright seat',
  ),
  machine(
    'G3-S30',
    'Lat Pulldown',
    'Back',
    ['lat pulldown', 'machine pulldown'],
    ['lat-pulldown'],
    [
      { muscle: 'Lats', percent: 50, role: 'primary' },
      { muscle: 'Biceps', percent: 20, role: 'secondary' },
      { muscle: 'Mid back', percent: 15, role: 'secondary' },
      { muscle: 'Rear delts', percent: 10, role: 'secondary' },
      { muscle: 'Rotator cuff', percent: 5, role: 'secondary' },
    ],
    'Lat pulldown machine with an overhead bar, thigh pads, and weight stack',
  ),
  machine(
    'G3-S31',
    'Seated Row',
    'Back',
    ['seated row', 'machine row'],
    ['seated-machine-row'],
    [
      { muscle: 'Mid back', percent: 35, role: 'primary' },
      { muscle: 'Lats', percent: 30, role: 'primary' },
      { muscle: 'Biceps', percent: 15, role: 'secondary' },
      { muscle: 'Rear delts', percent: 10, role: 'secondary' },
      { muscle: 'Rotator cuff', percent: 10, role: 'secondary' },
    ],
    'Seated row machine with a chest pad, forward handles, and weight stack',
  ),
  machine(
    'G3-S40',
    'Arm Curl',
    'Arms',
    ['machine biceps curl', 'arm curl', 'machine arm curl'],
    ['machine-arm-curl'],
    [
      { muscle: 'Biceps', percent: 60, role: 'primary' },
      { muscle: 'Brachialis', percent: 25, role: 'secondary' },
      { muscle: 'Forearms', percent: 15, role: 'secondary' },
    ],
    'Arm curl machine with an angled arm pad, handles, and weight stack',
  ),
  machine(
    'G3-S42',
    'Triceps Press',
    'Arms',
    ['machine triceps press', 'triceps press'],
    ['machine-triceps-press'],
    [
      { muscle: 'Triceps', percent: 80, role: 'primary' },
      { muscle: 'Front delts', percent: 15, role: 'secondary' },
      { muscle: 'Chest', percent: 5, role: 'secondary' },
    ],
    'Triceps press machine with a seated downward press station and weight stack',
  ),
  machine(
    'G3-S51',
    'Abdominal Crunch',
    'Core',
    ['machine abdominal crunch', 'abdominal crunch machine'],
    ['machine-abdominal-crunch'],
    [
      { muscle: 'Abdominals', percent: 55, role: 'primary' },
      { muscle: 'Hip flexors', percent: 25, role: 'secondary' },
      { muscle: 'Obliques', percent: 20, role: 'secondary' },
    ],
    'Abdominal crunch machine with a curved torso pad and weight stack',
  ),
  machine(
    'G3-S60',
    'Dip / Chin Assist',
    'Back',
    ['assisted pull-up', 'assisted pullup', 'assisted chin-up', 'chin assist', 'assisted dip'],
    ['assisted-chin-up', 'assisted-dip'],
    [
      { muscle: 'Lats', percent: 25, role: 'primary' },
      { muscle: 'Triceps', percent: 25, role: 'primary' },
      { muscle: 'Chest', percent: 20, role: 'secondary' },
      { muscle: 'Biceps', percent: 15, role: 'secondary' },
      { muscle: 'Front delts', percent: 10, role: 'secondary' },
      { muscle: 'Back stabilisers', percent: 5, role: 'secondary' },
    ],
    'Assisted dip and chin machine with a counterweighted knee platform',
  ),
  machine(
    'G3-S70',
    'Leg Press',
    'Legs',
    ['leg press', 'machine leg press'],
    ['machine-leg-press'],
    [
      { muscle: 'Quadriceps', percent: 50, role: 'primary' },
      { muscle: 'Glutes', percent: 30, role: 'primary' },
      { muscle: 'Hamstrings', percent: 10, role: 'secondary' },
      { muscle: 'Adductors', percent: 5, role: 'secondary' },
      { muscle: 'Calves', percent: 5, role: 'secondary' },
    ],
    'Seated leg press machine with a large footplate and weight stack',
  ),
  machine(
    'G3-S71',
    'Leg Extension',
    'Legs',
    ['leg extension', 'machine leg extension'],
    ['leg-extension'],
    [{ muscle: 'Quadriceps', percent: 100, role: 'primary' }],
    'Leg extension machine with a shin pad, adjustable seat, and weight stack',
  ),
  machine(
    'G3-S72',
    'Seated Leg Curl',
    'Legs',
    ['seated leg curl'],
    ['seated-leg-curl'],
    [
      { muscle: 'Hamstrings', percent: 95, role: 'primary' },
      { muscle: 'Calves', percent: 5, role: 'secondary' },
    ],
    'Seated leg curl machine with thigh and lower-leg pads and a weight stack',
  ),
  machine(
    'G3-S73',
    'Prone Leg Curl',
    'Legs',
    ['prone leg curl', 'lying leg curl'],
    ['prone-leg-curl'],
    [
      { muscle: 'Hamstrings', percent: 90, role: 'primary' },
      { muscle: 'Calves', percent: 10, role: 'secondary' },
    ],
    'Prone leg curl machine with a padded bench, ankle roller, and weight stack',
  ),
  machine(
    'G3-S74',
    'Hip Adductor',
    'Legs',
    ['hip adductor', 'inner thigh machine'],
    ['hip-adductor'],
    [
      { muscle: 'Adductor magnus', percent: 40, role: 'primary' },
      { muscle: 'Adductor longus', percent: 25, role: 'primary' },
      { muscle: 'Adductor brevis', percent: 15, role: 'secondary' },
      { muscle: 'Gracilis', percent: 10, role: 'secondary' },
      { muscle: 'Pectineus', percent: 10, role: 'secondary' },
    ],
    'Hip adductor machine with inward-moving thigh pads and a weight stack',
  ),
  machine(
    'G3-S75',
    'Hip Abductor',
    'Legs',
    ['hip abductor', 'outer thigh machine'],
    ['hip-abductor'],
    [
      { muscle: 'Gluteus medius', percent: 50, role: 'primary' },
      { muscle: 'Gluteus minimus', percent: 25, role: 'primary' },
      { muscle: 'Tensor fasciae latae', percent: 20, role: 'secondary' },
      { muscle: 'Other hip stabilisers', percent: 5, role: 'secondary' },
    ],
    'Hip abductor machine with outward-moving thigh pads and a weight stack',
  ),
] as const satisfies readonly GymMachine[];

export const MACHINE_REGIONS: readonly MachineRegion[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Core',
  'Legs',
];

export const MACHINE_BY_ID = new Map<MachineId, GymMachine>(
  MACHINES.map((entry) => [entry.id, entry]),
);

export function getMachine(id: MachineId): GymMachine | undefined {
  return MACHINE_BY_ID.get(id);
}

export function machinesForRegion(region: MachineRegion): readonly GymMachine[] {
  return MACHINES.filter((entry) => entry.enabled && entry.region === region);
}

export function validateMachineRegistry(): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  const aliases = new Map<string, string>();

  for (const entry of MACHINES) {
    if (ids.has(entry.id)) problems.push(`Duplicate machine id: ${entry.id}`);
    ids.add(entry.id);

    const total = entry.emphasis.reduce((sum, item) => sum + item.percent, 0);
    if (total !== 100) problems.push(`${entry.id} emphasis totals ${total}, expected 100`);
    for (const item of entry.emphasis) {
      if (item.percent < 0 || item.percent > 100) {
        problems.push(`${entry.id} has an invalid percentage for ${item.muscle}`);
      }
    }

    for (const alias of entry.aliases) {
      const normalized = alias.trim().toLowerCase();
      const owner = aliases.get(normalized);
      if (owner && owner !== entry.id)
        problems.push(`Alias ${alias} belongs to ${owner} and ${entry.id}`);
      aliases.set(normalized, entry.id);
    }
  }

  if (ids.has('G3-S52')) problems.push('Unconfirmed G3-S52 must not be present');
  if (MACHINES.length !== 16)
    problems.push(`Expected 16 confirmed machines, found ${MACHINES.length}`);
  return problems;
}
