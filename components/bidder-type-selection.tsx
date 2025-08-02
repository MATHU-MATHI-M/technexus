"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { BIDDER_TYPES } from '@/lib/user-profile'
import { Building2, Code, HardHat, Briefcase, ShoppingCart } from 'lucide-react'

const BIDDER_TYPE_ICONS = {
  CONTRACTOR: HardHat,
  DEVELOPER: Code,
  SUPPLIER: ShoppingCart,
  CONSULTANT: Briefcase,
  BUYER: Building2,
}

interface BidderTypeSelectionProps {
  onSelect: (type: string) => void
  selectedType?: string
}

export function BidderTypeSelection({ onSelect, selectedType }: BidderTypeSelectionProps) {
  const [selected, setSelected] = useState(selectedType)

  const handleSelect = (value: string) => {
    setSelected(value)
    onSelect(value)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>What best describes you?</CardTitle>
        <CardDescription>
          Select your role to help us personalize your experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selected}
          onValueChange={handleSelect}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {BIDDER_TYPES.map((type) => {
            const Icon = BIDDER_TYPE_ICONS[type.value as keyof typeof BIDDER_TYPE_ICONS]
            return (
              <div key={type.value} className="relative">
                <RadioGroupItem
                  value={type.value}
                  id={type.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={type.value}
                  className="flex flex-col items-center justify-center p-4 h-full rounded-lg border-2 
                           cursor-pointer transition-all
                           peer-checked:border-primary peer-checked:bg-primary/5
                           hover:bg-gray-50"
                >
                  <Icon className="h-8 w-8 mb-2 text-gray-600 peer-checked:text-primary" />
                  <div className="font-semibold mb-1">{type.label}</div>
                  <p className="text-sm text-gray-500 text-center">
                    {type.description}
                  </p>
                  <div className="mt-2">
                    <div className="text-xs text-gray-400">Sectors:</div>
                    <div className="text-xs text-gray-600">
                      {type.sectors.join(', ')}
                    </div>
                  </div>
                </Label>
              </div>
            )
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  )
}
