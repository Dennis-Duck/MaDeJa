"use client";

import { Step } from "@/types/step"
import { Logic } from "@/types/logic"

export function ConnectionLayer({ step }: { step: Step }) {
  const connections = step.logics.filter(l => l.parentId)

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10"
      width="100%"
      height="100%"
    >
      {connections.map((logic) => {
        const from = resolveParent(step, logic)
        if (!from) return null

        const to = getLogicAnchor(logic)

        return (
          <line
            key={logic.id}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="var(--accent)"
            strokeWidth={2}
            strokeDasharray={
              logic.parentType === "LOGIC" ? "4 2" : undefined
            }
          />
        )
      })}
    </svg>
  )
}

function resolveParent(
    step: Step,
    logic: Logic
): { x: number; y: number } | null {
            console.log(logic)
    if (!logic.parentId || !logic.parentType) return null

    if (logic.parentType === "ELEMENT") {
        const el = step.elements.find(e => e.id === logic.parentId)
        if (!el) return null

        return {
            x: el.x + (el.width ?? 200) / 2,
            y: el.y + (el.height ?? 60),
        }
    }

    if (logic.parentType === "TRIGGER") {

        const parentLogic = step.logics.find(l => l.id === logic.parentId)
        if (!parentLogic) return null

        return {
            x: parentLogic.x + (parentLogic.width ?? 160) / 2,
            y: parentLogic.y + (parentLogic.height ?? 60),
        }
    }

    return null
}

function getLogicAnchor(l: Logic) {
    return {
        x: l.x + (l.width ?? 150) / 2,
        y: l.y,
    }
}
