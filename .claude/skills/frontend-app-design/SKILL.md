# frontend-app-design skill

Create polished React Native / Expo mobile UI for this project. Follows iOS Human Interface Guidelines and the project's established design language.

## Design tokens

### Colors
```
Background:    #E5DFD1  (warm beige)
Card/Surface:  #F5EFE0  (lighter beige)
Input bg:      #EAE4D4
Border:        #EDE6D6

Primary green: #2A6B64  (buttons, accents)
Dark green:    #1C4F4A  (headers, gradients)
Brown:         #5A3800  (primary CTA)
Dark brown:    #7A6B55  (secondary text)
Muted:         #9A8E78  (captions, placeholders)

Text primary:  #1A1A1A
Text body:     #2A2A2A

Red (danger):  #7A2E2E
Error:         #C0392B
Success:       #2E7D32
```

### Typography
```typescript
// Headings
fontFamily: 'DMSerifDisplay_400Regular'  // Large titles, hero text

// Body
fontFamily: 'DMSans_400Regular'    // Body text
fontFamily: 'DMSans_600SemiBold'   // Semi-bold emphasis
fontFamily: 'DMSans_700Bold'       // Bold labels, buttons

// Monospace / labels
fontFamily: 'SpaceMono_400Regular' // Section labels, eyebrows (uppercase, letterSpacing: 2)
```

### Gradients (LinearGradient)
```typescript
// Header gradient
colors={['#1C4F4A', '#2A6B64']}

// Course colors
förrätt:  ['#2E6B4A', '#1C4F32']
varmrätt: ['#7A2E2E', '#5C1E1E']
efterrätt: ['#4A2E7A', '#321C5C']
```

## Component patterns

### Section label (eyebrow)
```typescript
<Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 9, letterSpacing: 2, color: '#9A8E78' }}>
  SECTION LABEL
</Text>
```

### Screen header
```typescript
<LinearGradient colors={['#1C4F4A', '#2A6B64']} style={[styles.header, { paddingTop: insets.top + 16 }]}>
  <Text style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.75)' }}>
    KANINENS CYKELFEST 2026
  </Text>
  <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 36, color: '#F5EFE0' }}>
    Sidtitel
  </Text>
</LinearGradient>
```

### Card
```typescript
<View style={{ backgroundColor: '#F5EFE0', borderRadius: 14, padding: 16, marginBottom: 12 }}>
  ...
</View>
```

### Primary button
```typescript
<TouchableOpacity style={{ backgroundColor: '#5A3800', borderRadius: 10, paddingVertical: 13, alignItems: 'center' }}>
  <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: '#fff' }}>Knapptext</Text>
</TouchableOpacity>
```

### Secondary button
```typescript
<TouchableOpacity style={{ backgroundColor: '#EAE4D4', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}>
  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#7A6B55' }}>Avbryt</Text>
</TouchableOpacity>
```

### Input
```typescript
<TextInput
  style={{ backgroundColor: '#EAE4D4', borderRadius: 10, padding: 12, fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#2A2A2A' }}
  placeholderTextColor="#B8B0A0"
/>
```

## Key rules
- Use `PressableScale` from `@/components/PressableScale` for tappable cards (scale animation)
- Use `lucide-react-native` for icons
- Use NativeWind (`className`) for most styling — inline `style` only when NativeWind can't handle it (LinearGradient, CameraView, Animated components)
- Use `cn()` from `@/lib/cn.ts` when merging conditional classNames
- SafeAreaView: import from `react-native-safe-area-context`, use `useSafeAreaInsets()` hook
- No purple gradients on white, no generic centered layouts
- Animations: use `react-native-reanimated` (not `Animated` from react-native)
