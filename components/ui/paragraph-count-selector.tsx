"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Minus, Plus } from "lucide-react"

interface ParagraphCountSelectorProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

export function ParagraphCountSelector({
  value,
  onChange,
  min = 1,
  max = 10
}: ParagraphCountSelectorProps) {
  const [count, setCount] = useState(value)

  const handleChange = (newValue: number) => {
    // 确保值在范围内
    const validValue = Math.max(min, Math.min(max, newValue))
    setCount(validValue)
    onChange(validValue)
  }

  const increment = () => {
    if (count < max) {
      handleChange(count + 1)
    }
  }

  const decrement = () => {
    if (count > min) {
      handleChange(count - 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10)
    if (!isNaN(newValue)) {
      handleChange(newValue)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="paragraph-count">段落数量</Label>
      <div className="flex items-center">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={decrement}
          disabled={count <= min}
          className="h-9 w-9"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          id="paragraph-count"
          type="number"
          value={count}
          onChange={handleInputChange}
          min={min}
          max={max}
          className="h-9 w-16 mx-2 text-center"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={increment}
          disabled={count >= max}
          className="h-9 w-9"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}