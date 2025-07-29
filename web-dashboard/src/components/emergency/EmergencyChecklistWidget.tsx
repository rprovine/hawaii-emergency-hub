"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ShoppingCart, 
  Package, 
  Home, 
  Car, 
  Briefcase,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Download,
  RefreshCw
} from 'lucide-react'

interface ChecklistItem {
  id: string
  name: string
  category: string
  priority: 'essential' | 'important' | 'recommended'
  quantity: string
  notes?: string
  checked: boolean
  expirationMonths?: number
  lastChecked?: Date
}

interface ChecklistCategory {
  id: string
  name: string
  icon: any
  description: string
  items: ChecklistItem[]
}

export function EmergencyChecklistWidget() {
  const [familySize, setFamilySize] = useState(4)
  const [selectedCategory, setSelectedCategory] = useState('water-food')
  const [checklist, setChecklist] = useState<ChecklistCategory[]>([])
  const [completionStats, setCompletionStats] = useState({
    total: 0,
    completed: 0,
    essential: { total: 0, completed: 0 },
    important: { total: 0, completed: 0 },
    recommended: { total: 0, completed: 0 }
  })

  // Initialize checklist based on family size
  useEffect(() => {
    const baseChecklist: ChecklistCategory[] = [
      {
        id: 'water-food',
        name: 'Water & Food',
        icon: Package,
        description: 'Essential supplies for survival',
        items: [
          {
            id: 'water',
            name: 'Drinking Water',
            category: 'water-food',
            priority: 'essential',
            quantity: `${familySize * 3} gallons (3 days)`,
            notes: '1 gallon per person per day minimum',
            checked: false,
            expirationMonths: 12
          },
          {
            id: 'water-extra',
            name: 'Extra Water for Hygiene',
            category: 'water-food',
            priority: 'important',
            quantity: `${familySize * 2} gallons`,
            checked: false,
            expirationMonths: 12
          },
          {
            id: 'non-perishable-food',
            name: 'Non-perishable Food',
            category: 'water-food',
            priority: 'essential',
            quantity: `${familySize * 3} days worth`,
            notes: 'Canned goods, dried fruits, nuts, energy bars',
            checked: false,
            expirationMonths: 24
          },
          {
            id: 'manual-can-opener',
            name: 'Manual Can Opener',
            category: 'water-food',
            priority: 'essential',
            quantity: '2',
            checked: false
          },
          {
            id: 'cooking-fuel',
            name: 'Portable Stove & Fuel',
            category: 'water-food',
            priority: 'important',
            quantity: '1 stove + extra fuel',
            notes: 'Camping stove or similar',
            checked: false
          },
          {
            id: 'water-purification',
            name: 'Water Purification Tablets',
            category: 'water-food',
            priority: 'important',
            quantity: '2 bottles',
            checked: false,
            expirationMonths: 60
          }
        ]
      },
      {
        id: 'medical-safety',
        name: 'Medical & Safety',
        icon: AlertTriangle,
        description: 'First aid and safety equipment',
        items: [
          {
            id: 'first-aid-kit',
            name: 'Comprehensive First Aid Kit',
            category: 'medical-safety',
            priority: 'essential',
            quantity: '1 large kit',
            notes: 'Include prescription medications',
            checked: false
          },
          {
            id: 'prescription-meds',
            name: 'Prescription Medications',
            category: 'medical-safety',
            priority: 'essential',
            quantity: '7-day supply minimum',
            notes: 'Keep updated and rotate stock',
            checked: false,
            expirationMonths: 12
          },
          {
            id: 'fire-extinguisher',
            name: 'Fire Extinguisher',
            category: 'medical-safety',
            priority: 'important',
            quantity: '1-2 units',
            checked: false
          },
          {
            id: 'smoke-detectors',
            name: 'Smoke Detector Batteries',
            category: 'medical-safety',
            priority: 'important',
            quantity: 'Extra batteries',
            checked: false,
            expirationMonths: 12
          },
          {
            id: 'emergency-whistle',
            name: 'Emergency Whistles',
            category: 'medical-safety',
            priority: 'essential',
            quantity: `${familySize} whistles`,
            checked: false
          }
        ]
      },
      {
        id: 'communication-power',
        name: 'Communication',
        icon: Briefcase,
        description: 'Stay connected during emergencies',
        items: [
          {
            id: 'battery-radio',
            name: 'Battery/Crank Radio',
            category: 'communication-power',
            priority: 'essential',
            quantity: '1-2 radios',
            notes: 'NOAA Weather Radio capable',
            checked: false
          },
          {
            id: 'cell-phone-chargers',
            name: 'Portable Phone Chargers',
            category: 'communication-power',
            priority: 'essential',
            quantity: `${familySize} power banks`,
            checked: false
          },
          {
            id: 'flashlights',
            name: 'Flashlights',
            category: 'communication-power',
            priority: 'essential',
            quantity: `${familySize} flashlights`,
            checked: false
          },
          {
            id: 'extra-batteries',
            name: 'Extra Batteries',
            category: 'communication-power',
            priority: 'essential',
            quantity: 'Various sizes',
            notes: 'AA, AAA, D, 9V',
            checked: false,
            expirationMonths: 24
          },
          {
            id: 'emergency-contacts',
            name: 'Emergency Contact List',
            category: 'communication-power',
            priority: 'essential',
            quantity: 'Laminated copies',
            notes: 'Keep in multiple locations',
            checked: false
          }
        ]
      },
      {
        id: 'shelter-clothing',
        name: 'Shelter & Clothing',
        icon: Home,
        description: 'Protection from elements',
        items: [
          {
            id: 'emergency-shelter',
            name: 'Emergency Shelter/Tent',
            category: 'shelter-clothing',
            priority: 'important',
            quantity: '1-2 person capacity per family',
            checked: false
          },
          {
            id: 'sleeping-bags',
            name: 'Sleeping Bags/Blankets',
            category: 'shelter-clothing',
            priority: 'important',
            quantity: `${familySize} sleeping bags`,
            checked: false
          },
          {
            id: 'rain-gear',
            name: 'Rain Gear',
            category: 'shelter-clothing',
            priority: 'important',
            quantity: `${familySize} rain coats`,
            checked: false
          },
          {
            id: 'work-gloves',
            name: 'Work Gloves',
            category: 'shelter-clothing',
            priority: 'recommended',
            quantity: `${familySize} pairs`,
            checked: false
          },
          {
            id: 'plastic-sheeting',
            name: 'Plastic Sheeting & Duct Tape',
            category: 'shelter-clothing',
            priority: 'important',
            quantity: '10x10 feet + 2 rolls tape',
            notes: 'For shelter/weather protection',
            checked: false
          }
        ]
      },
      {
        id: 'tools-supplies',
        name: 'Tools & Supplies',
        icon: Car,
        description: 'Utility and maintenance items',
        items: [
          {
            id: 'multi-tool',
            name: 'Multi-tool/Swiss Army Knife',
            category: 'tools-supplies',
            priority: 'important',
            quantity: '2-3 tools',
            checked: false
          },
          {
            id: 'rope-cord',
            name: 'Rope/Paracord',
            category: 'tools-supplies',
            priority: 'recommended',
            quantity: '100 feet',
            checked: false
          },
          {
            id: 'garbage-bags',
            name: 'Heavy-duty Garbage Bags',
            category: 'tools-supplies',
            priority: 'important',
            quantity: '2 boxes',
            notes: 'Multiple uses including waterproofing',
            checked: false
          },
          {
            id: 'hand-sanitizer',
            name: 'Hand Sanitizer',
            category: 'tools-supplies',
            priority: 'important',
            quantity: '4-6 bottles',
            checked: false,
            expirationMonths: 24
          },
          {
            id: 'matches-lighter',
            name: 'Waterproof Matches/Lighter',
            category: 'tools-supplies',
            priority: 'important',
            quantity: '3-4 sets',
            checked: false
          },
          {
            id: 'cash',
            name: 'Emergency Cash',
            category: 'tools-supplies',
            priority: 'important',
            quantity: '$500-1000 small bills',
            notes: 'ATMs may not work during emergencies',
            checked: false
          }
        ]
      }
    ]

    setChecklist(baseChecklist)
  }, [familySize])

  // Calculate completion statistics
  useEffect(() => {
    const allItems = checklist.flatMap(cat => cat.items)
    const completed = allItems.filter(item => item.checked)
    
    const essential = allItems.filter(item => item.priority === 'essential')
    const important = allItems.filter(item => item.priority === 'important')
    const recommended = allItems.filter(item => item.priority === 'recommended')

    setCompletionStats({
      total: allItems.length,
      completed: completed.length,
      essential: {
        total: essential.length,
        completed: essential.filter(item => item.checked).length
      },
      important: {
        total: important.length,
        completed: important.filter(item => item.checked).length
      },
      recommended: {
        total: recommended.length,
        completed: recommended.filter(item => item.checked).length
      }
    })
  }, [checklist])

  const toggleItem = (categoryId: string, itemId: string) => {
    setChecklist(prev => prev.map(category => ({
      ...category,
      items: category.items.map(item => 
        item.id === itemId ? { 
          ...item, 
          checked: !item.checked,
          lastChecked: new Date()
        } : item
      )
    })))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'essential': return 'bg-red-100 text-red-800 border-red-200'
      case 'important': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'recommended': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const currentCategory = checklist.find(cat => cat.id === selectedCategory)
  const overallProgress = completionStats.total > 0 ? (completionStats.completed / completionStats.total) * 100 : 0

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Emergency Supplies Checklist
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Prepare your family for emergencies
            </p>
          </div>
          <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
            <Users className="h-4 w-4 text-blue-600" />
            <label className="text-sm font-semibold text-blue-900">Family Size:</label>
            <select 
              value={familySize}
              onChange={(e) => setFamilySize(Number(e.target.value))}
              className="bg-white border-2 border-blue-300 rounded-md px-3 py-1 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-w-[60px]"
            >
              {[1,2,3,4,5,6,7,8].map(size => (
                <option key={size} value={size} className="font-semibold">{size} {size === 1 ? 'person' : 'people'}</option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress Overview */}
        <div className="space-y-6 mb-8">
          {/* Overall Progress Card */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-lg font-semibold text-gray-900">Overall Progress</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(overallProgress)}%
                </div>
                <div className="text-sm text-gray-600">
                  {completionStats.completed} of {completionStats.total} items
                </div>
              </div>
            </div>
            <Progress value={overallProgress} className="h-4" />
            {overallProgress >= 80 && (
              <div className="mt-3 flex items-center gap-2 text-green-700 bg-green-100 px-3 py-2 rounded-lg">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Excellent! Your family is well-prepared for emergencies.</span>
              </div>
            )}
          </div>

          {/* Priority Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-semibold text-red-900">Essential Items</span>
              </div>
              <div className="text-3xl font-bold text-red-600 mb-1">
                {completionStats.essential.completed}/{completionStats.essential.total}
              </div>
              <div className="text-xs text-red-700 mb-2">Critical for survival</div>
              <Progress 
                value={completionStats.essential.total > 0 ? (completionStats.essential.completed / completionStats.essential.total) * 100 : 0} 
                className="h-2"
              />
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-900">Important Items</span>
              </div>
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {completionStats.important.completed}/{completionStats.important.total}
              </div>
              <div className="text-xs text-orange-700 mb-2">Highly recommended</div>
              <Progress 
                value={completionStats.important.total > 0 ? (completionStats.important.completed / completionStats.important.total) * 100 : 0} 
                className="h-2"
              />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Home className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">Recommended Items</span>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {completionStats.recommended.completed}/{completionStats.recommended.total}
              </div>
              <div className="text-xs text-blue-700 mb-2">Nice to have</div>
              <Progress 
                value={completionStats.recommended.total > 0 ? (completionStats.recommended.completed / completionStats.recommended.total) * 100 : 0} 
                className="h-2"
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 p-1 bg-gray-100 rounded-xl h-auto">
            {checklist.map((category) => {
              const Icon = category.icon
              const categoryProgress = category.items.filter(item => item.checked).length / category.items.length * 100
              const isActive = selectedCategory === category.id
              return (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id} 
                  className={`flex flex-col gap-2 p-4 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-white shadow-md border border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className={`text-xs font-medium ${isActive ? 'text-blue-900' : 'text-gray-600'}`}>
                    {category.name}
                  </span>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        categoryProgress === 100 ? 'bg-green-500' : 
                        categoryProgress > 50 ? 'bg-blue-500' : 
                        'bg-orange-500'
                      }`}
                      style={{ width: `${categoryProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {Math.round(categoryProgress)}%
                  </span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {/* Category Content */}
          {checklist.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{category.name}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
                <Badge variant="outline">
                  {category.items.filter(item => item.checked).length} / {category.items.length} Complete
                </Badge>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                {category.items.map((item) => (
                  <div 
                    key={item.id} 
                    className={`border-2 rounded-xl p-5 space-y-3 transition-all duration-200 ${
                      item.checked 
                        ? 'bg-green-50 border-green-200 shadow-sm' 
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => toggleItem(category.id, item.id)}
                          className="h-5 w-5"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className={`text-lg font-semibold ${
                            item.checked 
                              ? 'line-through text-green-700' 
                              : 'text-gray-900'
                          }`}>
                            {item.name}
                          </h4>
                          <Badge className={`${getPriorityColor(item.priority)} font-medium`}>
                            {item.priority.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-900">Quantity:</span>
                            <span className="text-sm font-bold text-blue-800">{item.quantity}</span>
                          </div>
                        </div>
                        
                        {item.notes && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">💡 Tip:</span> {item.notes}
                            </p>
                          </div>
                        )}
                        
                        {item.expirationMonths && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-orange-600" />
                              <span className="text-sm font-medium text-orange-800">
                                ⏰ Replace every {item.expirationMonths} months
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {item.checked && (
                          <div className="flex items-center gap-2 text-green-700 bg-green-100 px-3 py-2 rounded-lg">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">✅ Complete!</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Export Shopping List
          </Button>
          <Button variant="outline" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
          {overallProgress >= 80 && (
            <Button className="flex-1 bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Well Prepared!
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}