export const WHOLE_ANIMAL_DATA = {
  beef: {
    label: 'Beef',
    description: 'Grass-fed, USDA Choice · Dry-aged 21 days',
    color: '#c0392b',
    options: [
      { id: 'whole',   label: 'Whole',   symbol: '◉', weight: '~750 lbs', price: 2800, note: 'Full carcass, custom cut' },
      { id: 'half',    label: 'Half',    symbol: '◑', weight: '~375 lbs', price: 1450, note: 'Forequarter or hindquarter' },
      { id: 'quarter', label: 'Quarter', symbol: '◔', weight: '~190 lbs', price: 750,  note: 'Front or rear quarter' },
    ],
  },
  pork: {
    label: 'Pork',
    description: 'Heritage breed · Pasture-raised',
    color: '#d35400',
    options: [
      { id: 'whole',   label: 'Whole',   symbol: '◉', weight: '~200 lbs', price: 420, note: 'Full carcass, custom cut' },
      { id: 'half',    label: 'Half',    symbol: '◑', weight: '~100 lbs', price: 215, note: 'Split side, all primals' },
      { id: 'quarter', label: 'Quarter', symbol: '◔', weight: '~50 lbs',  price: 115, note: 'Front or rear portion' },
    ],
  },
  lamb: {
    label: 'Lamb',
    description: 'Pasture-raised · Hormone-free',
    color: '#27ae60',
    options: [
      { id: 'whole',   label: 'Whole',   symbol: '◉', weight: '~65 lbs', price: 320, note: 'Full carcass, custom cut' },
      { id: 'half',    label: 'Half',    symbol: '◑', weight: '~33 lbs', price: 165, note: 'Split side, all primals' },
      { id: 'quarter', label: 'Quarter', symbol: '◔', weight: '~17 lbs', price: 85,  note: 'Front or rear portion' },
    ],
  },
}
