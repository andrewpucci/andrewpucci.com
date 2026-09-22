const identity = ({ name, from, to }) => `${name}\u0000${from}\u0000${to}`;

function coverageGroup(input, dependency) {
  const item = input.coverage?.items?.find(
    (candidate) => identity(candidate.update) === identity(dependency)
  );
  return item?.group ?? { kind: 'standalone', anchor: null };
}

export function decisionUnits(input) {
  const grouped = new Map();
  for (const dependency of input.packages) {
    const group = coverageGroup(input, dependency);
    const key =
      group.kind === 'direct'
        ? `direct:${identity(group.anchor)}`
        : `standalone:${identity(dependency)}`;
    const unit = grouped.get(key) ?? { group, members: [] };
    unit.members.push(dependency);
    grouped.set(key, unit);
  }
  return [...grouped.values()].map((unit, index) => {
    const anchor =
      unit.group.kind === 'direct'
        ? unit.members.find((dependency) => identity(dependency) === identity(unit.group.anchor))
        : unit.members[0];
    return {
      id: `unit-${index + 1}`,
      group: unit.group,
      // A direct anchor always belongs to its group; the fallback keeps incomplete input safe to report.
      anchor: anchor ?? unit.members[0],
      members: unit.members,
    };
  });
}

export function modelPacket(input) {
  const units = decisionUnits(input);
  return {
    pullRequest: input.pullRequest,
    packages: units.map((unit) => unit.anchor),
    decisionUnits: units.map((unit) => ({
      id: unit.id,
      kind: unit.group.kind,
      anchor: {
        name: unit.anchor.name,
        from: unit.anchor.from,
        to: unit.anchor.to,
      },
      memberCount: unit.members.length,
    })),
    ...(input.policy ? { policy: input.policy } : {}),
  };
}
