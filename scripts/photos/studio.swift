// Re-renders a product photo as a clean, high-end studio shot.
//
//   studio <input> <output.jpg> [size]
//
// The fountain itself is never altered: only the plain white (or
// transparent) background around it is removed, so its shape, color and
// details stay exactly as photographed.
//
// 1. Accepts product shots on a white or transparent background; anything
//    else (lifestyle photos, close-ups, color chips) is skipped.
// 2. Removes the background by flood-filling inward from the photo's edges.
// 3. Drops the "COOL DOG" watermark strip along the bottom.
// 4. Places the subject, uncropped and centered, on a soft aqua studio
//    backdrop with a contact shadow, upscales with Lanczos and lightly
//    sharpens. Writes a square JPEG.
//
// Prints one JSON line describing what happened.

import CoreImage
import Foundation
import ImageIO

struct Output: Encodable {
  let status: String
  var reason: String? = nil
  var mode: String? = nil
  var watermarkRemoved: Bool? = nil
}

func finish(_ output: Output) -> Never {
  print(String(data: try! JSONEncoder().encode(output), encoding: .utf8)!)
  exit(0)
}

let args = CommandLine.arguments
guard args.count >= 3 else {
  FileHandle.standardError.write("usage: studio <input> <output.jpg> [size]\n".data(using: .utf8)!)
  exit(2)
}
let inputURL = URL(fileURLWithPath: args[1])
let outputURL = URL(fileURLWithPath: args[2])
let size = CGFloat(args.count > 3 ? Double(args[3]) ?? 1400 : 1400)

let sRGB = CGColorSpace(name: CGColorSpace.sRGB)!
let context = CIContext(options: [.workingColorSpace: sRGB, .outputColorSpace: sRGB])

guard let loaded = CIImage(contentsOf: inputURL, options: [.applyOrientationProperty: true]) else {
  finish(Output(status: "skip", reason: "unreadable"))
}
let source = loaded.transformed(
  by: CGAffineTransform(translationX: -loaded.extent.minX, y: -loaded.extent.minY))
let W = Int(source.extent.width), H = Int(source.extent.height)

// ---- Read pixels (row 0 = top) ---------------------------------------------

var rgba = [UInt8](repeating: 0, count: W * H * 4)
context.render(
  source, toBitmap: &rgba, rowBytes: W * 4,
  bounds: CGRect(x: 0, y: 0, width: W, height: H), format: .RGBA8, colorSpace: sRGB)
// (Core Image fills the bitmap top row first.)

@inline(__always) func px(_ x: Int, _ y: Int) -> Int { (y * W + x) * 4 }

func onBorder(_ x: Int, _ y: Int, _ band: Int) -> Bool {
  x < band || y < band || x >= W - band || y >= H - band
}

// ---- 1. What kind of photo is this? -----------------------------------------

var borderTotal = 0, borderClear = 0, borderWhite = 0
let band = max(2, min(W, H) / 100)
for y in 0..<H {
  for x in 0..<W where onBorder(x, y, band) {
    let i = px(x, y)
    borderTotal += 1
    if rgba[i + 3] < 40 { borderClear += 1 }
    else if min(rgba[i], rgba[i + 1], rgba[i + 2]) > 228 { borderWhite += 1 }
  }
}
let clearShare = Double(borderClear) / Double(borderTotal)
let whiteShare = Double(borderWhite + borderClear) / Double(borderTotal)

enum Mode: String { case transparent, white }
let mode: Mode
if clearShare > 0.4 { mode = .transparent }
else if whiteShare > 0.82 { mode = .white }
else { finish(Output(status: "skip", reason: String(format: "not a studio shot (edges %.0f%% white)", whiteShare * 100))) }

// ---- 2. Background mask: flood fill from the edges -----------------------------

// Premultiplied alpha → for "white" mode treat transparent pixels as white.
@inline(__always) func isBackground(_ i: Int) -> Bool {
  let a = rgba[i + 3]
  if a < 30 { return true }
  if mode == .transparent { return false }
  let r = rgba[i], g = rgba[i + 1], b = rgba[i + 2]
  let lo = min(r, g, b), hi = max(r, g, b)
  return lo >= 236 && hi - lo <= 16
}

var background = [Bool](repeating: false, count: W * H)
var stack: [Int] = []
stack.reserveCapacity(W * 4)
for y in 0..<H {
  for x in 0..<W where x == 0 || y == 0 || x == W - 1 || y == H - 1 {
    let p = y * W + x
    if isBackground(p * 4) && !background[p] { background[p] = true; stack.append(p) }
  }
}
while let p = stack.popLast() {
  let x = p % W, y = p / W
  for (nx, ny) in [(x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)]
  where nx >= 0 && ny >= 0 && nx < W && ny < H {
    let q = ny * W + nx
    if !background[q] && isBackground(q * 4) { background[q] = true; stack.append(q) }
  }
}

// ---- 3. Watermark: a separate strip of content along the bottom ---------------

var rowHasContent = [Bool](repeating: false, count: H)
for y in 0..<H {
  var count = 0
  for x in 0..<W where !background[y * W + x] { count += 1 }
  rowHasContent[y] = count > max(2, W / 400)
}
var watermarkRemoved = false
do {
  // Bottom-most block of content rows, and the gap above it.
  var y = H - 1
  while y >= 0 && !rowHasContent[y] { y -= 1 }
  let blockBottom = y
  while y >= 0 && rowHasContent[y] { y -= 1 }
  let blockTop = y + 1
  var gapTop = y
  while gapTop >= 0 && !rowHasContent[gapTop] { gapTop -= 1 }
  let blockHeight = blockBottom - blockTop + 1
  let gap = y - gapTop
  let hasContentAbove = gapTop >= 0
  if blockBottom >= 0, hasContentAbove,
    Double(blockTop) > Double(H) * 0.62,
    Double(blockHeight) < Double(H) * 0.2,
    Double(gap) >= Double(H) * 0.006
  {
    for row in blockTop...blockBottom { for x in 0..<W { background[row * W + x] = true } }
    watermarkRemoved = true
  }
}

// ---- Watermarks beside the subject: small shapes set apart from it ----------------

// Group clearly visible pixels into connected shapes. The fountain and dog are
// big shapes; a corner watermark is a cluster of small letter shapes nearby.
@inline(__always) func isSolid(_ p: Int) -> Bool {
  if background[p] { return false }
  let i = p * 4
  let lo = min(rgba[i], rgba[i + 1], rgba[i + 2]), hi = max(rgba[i], rgba[i + 1], rgba[i + 2])
  return rgba[i + 3] > 60 && (lo < 215 || hi - lo > 28)
}
var label = [Int32](repeating: -1, count: W * H)
struct Shape { var area = 0; var minX = Int.max, minY = Int.max, maxX = -1, maxY = -1 }
var shapes: [Shape] = []
for start in 0..<(W * H) where label[start] < 0 && isSolid(start) {
  let id = Int32(shapes.count)
  var shape = Shape()
  label[start] = id
  stack.append(start)
  while let p = stack.popLast() {
    let x = p % W, y = p / W
    shape.area += 1
    shape.minX = min(shape.minX, x); shape.maxX = max(shape.maxX, x)
    shape.minY = min(shape.minY, y); shape.maxY = max(shape.maxY, y)
    for dy in -1...1 {
      for dx in -1...1 where dx != 0 || dy != 0 {
        let nx = x + dx, ny = y + dy
        guard nx >= 0, ny >= 0, nx < W, ny < H else { continue }
        let q = ny * W + nx
        if label[q] < 0 && isSolid(q) { label[q] = id; stack.append(q) }
      }
    }
  }
  shapes.append(shape)
}
var removedShapes = 0
if let largest = shapes.map(\.area).max() {
  let isMain = shapes.map { $0.area * 12 >= largest }
  var box = (minX: Int.max, minY: Int.max, maxX: -1, maxY: -1)
  for (i, s) in shapes.enumerated() where isMain[i] {
    box = (min(box.minX, s.minX), min(box.minY, s.minY), max(box.maxX, s.maxX), max(box.maxY, s.maxY))
  }
  let padX = W * 3 / 200, padY = H * 3 / 200
  box = (box.minX - padX, box.minY - padY, box.maxX + padX, box.maxY + padY)
  // Small shapes outside the subject's box are watermark pieces; letters right
  // next to a removed piece belong to the same watermark.
  var removed = shapes.indices.map { i in
    let s = shapes[i]
    return !isMain[i] && !(s.maxX >= box.minX && s.minX <= box.maxX && s.maxY >= box.minY && s.minY <= box.maxY)
  }
  let reach = W / 40
  var changed = true
  while changed {
    changed = false
    for i in shapes.indices where !isMain[i] && !removed[i] {
      let s = shapes[i]
      let nearRemoved = shapes.indices.contains { j in
        guard removed[j] else { return false }
        let r = shapes[j]
        return s.maxX + reach >= r.minX && s.minX - reach <= r.maxX && s.maxY + reach >= r.minY && s.minY - reach <= r.maxY
      }
      if nearRemoved { removed[i] = true; changed = true }
    }
  }
  for (i, s) in shapes.enumerated() where removed[i] {
    removedShapes += 1
    // Clear the shape and its soft edge.
    for y in max(0, s.minY - 3)...min(H - 1, s.maxY + 3) {
      for x in max(0, s.minX - 3)...min(W - 1, s.maxX + 3) {
        let p = y * W + x
        let owner = label[p]
        if owner < 0 || !isMain[Int(owner)] { background[p] = true }
      }
    }
  }
}
if removedShapes >= 3 { watermarkRemoved = true }

// ---- Subject bounds --------------------------------------------------------------

// Measure from clearly visible pixels only, so the faint drop shadow left in
// the original photo doesn't make the subject look like it is floating.
// Rows/columns need a few solid pixels to count, which ignores stray specks.
var rowSolid = [Int](repeating: 0, count: H), colSolid = [Int](repeating: 0, count: W)
for y in 0..<H {
  for x in 0..<W where !background[y * W + x] {
    let i = (y * W + x) * 4
    let lo = min(rgba[i], rgba[i + 1], rgba[i + 2]), hi = max(rgba[i], rgba[i + 1], rgba[i + 2])
    guard rgba[i + 3] > 60, lo < 215 || hi - lo > 28 else { continue }
    rowSolid[y] += 1
    colSolid[x] += 1
  }
}
let rowMin = max(3, W / 250), colMin = max(3, H / 250)
var minY = rowSolid.firstIndex { $0 >= rowMin } ?? H
var maxY = rowSolid.lastIndex { $0 >= rowMin } ?? -1
var minX = colSolid.firstIndex { $0 >= colMin } ?? W
var maxX = colSolid.lastIndex { $0 >= colMin } ?? -1
guard maxX >= 0, (maxX - minX) * (maxY - minY) > (W * H) / 50 else {
  finish(Output(status: "skip", reason: "no subject found"))
}
// A close-up cuts straight through the product at two opposite edges (wide
// runs of product along both). A full product that is merely framed tightly
// only touches an edge with a narrow cap or base on one side.
let edge = max(3, min(W, H) / 100)
func edgeSpan(rows: ClosedRange<Int>) -> Int { rows.map { rowSolid[$0] }.max() ?? 0 }
func edgeSpan(cols: ClosedRange<Int>) -> Int { cols.map { colSolid[$0] }.max() ?? 0 }
let cutTopBottom = edgeSpan(rows: 0...edge) > W * 3 / 10 && edgeSpan(rows: (H - 1 - edge)...(H - 1)) > W * 3 / 10
let cutSides = edgeSpan(cols: 0...edge) > H * 3 / 10 && edgeSpan(cols: (W - 1 - edge)...(W - 1)) > H * 3 / 10
if mode == .white && (cutTopBottom || cutSides) {
  finish(Output(status: "skip", reason: "close-up (product runs off the frame)"))
}
// Anything outside the subject's box (leftover shadow haze) becomes background.
let margin = max(2, min(W, H) / 200)
minX = max(0, minX - margin); minY = max(0, minY - margin)
maxX = min(W - 1, maxX + margin); maxY = min(H - 1, maxY + margin)
for y in 0..<H {
  for x in 0..<W where x < minX || x > maxX || y < minY || y > maxY { background[y * W + x] = true }
}

// ---- Build the cut-out ----------------------------------------------------------

var maskBytes = [UInt8](repeating: 0, count: W * H)
for y in 0..<H {
  let dst = y * W
  for x in 0..<W {
    let i = (y * W + x) * 4
    let keep = !background[y * W + x]
    maskBytes[dst + x] = keep ? (mode == .transparent ? rgba[i + 3] : 255) : 0
  }
}
let maskImage = CIImage(
  bitmapData: Data(maskBytes), bytesPerRow: W, size: CGSize(width: W, height: H),
  format: .L8, colorSpace: nil)
  .clampedToExtent().applyingGaussianBlur(sigma: 0.6).cropped(to: source.extent)

let opaqueSource = source.composited(over: CIImage(color: .white).cropped(to: source.extent))
let cutout = opaqueSource.applyingFilter(
  "CIBlendWithMask",
  parameters: [kCIInputBackgroundImageKey: CIImage.empty(), kCIInputMaskImageKey: maskImage])

// Pixel box (top-left origin) → Core Image box (bottom-left origin).
let subjectRect = CGRect(
  x: minX, y: H - 1 - maxY, width: maxX - minX + 1, height: maxY - minY + 1)
let subject = cutout.cropped(to: subjectRect)
  .transformed(by: CGAffineTransform(translationX: -subjectRect.minX, y: -subjectRect.minY))

// ---- 4. Compose the studio shot ------------------------------------------------

let fill: CGFloat = 0.8
let scale = min(size * fill / subjectRect.width, size * fill / subjectRect.height)
let scaled = subject.applyingFilter(
  "CILanczosScaleTransform", parameters: [kCIInputScaleKey: scale, kCIInputAspectRatioKey: 1.0])
let drawnW = scaled.extent.width, drawnH = scaled.extent.height
let originX = ((size - drawnW) / 2).rounded()
let originY = ((size - drawnH) / 2 - size * 0.025).rounded()
let placed = scaled
  .applyingFilter("CISharpenLuminance", parameters: [kCIInputSharpnessKey: 0.35, kCIInputRadiusKey: 1.2])
  .cropped(to: scaled.extent)
  .transformed(by: CGAffineTransform(translationX: originX, y: originY))

let canvas = CGRect(x: 0, y: 0, width: size, height: size)

// Backdrop: near-white at the top fading to pale aqua at the floor.
let backdrop = CIFilter(
  name: "CILinearGradient",
  parameters: [
    "inputPoint0": CIVector(x: 0, y: size), "inputColor0": CIColor(red: 0.985, green: 0.993, blue: 0.993),
    "inputPoint1": CIVector(x: 0, y: 0), "inputColor1": CIColor(red: 0.886, green: 0.941, blue: 0.937),
  ])!.outputImage!.cropped(to: canvas)
let glow = CIFilter(
  name: "CIRadialGradient",
  parameters: [
    "inputCenter": CIVector(x: size / 2, y: size * 0.55), "inputRadius0": size * 0.05, "inputRadius1": size * 0.62,
    "inputColor0": CIColor(red: 1, green: 1, blue: 1, alpha: 0.9),
    "inputColor1": CIColor(red: 1, green: 1, blue: 1, alpha: 0),
  ])!.outputImage!.cropped(to: canvas)

// Contact shadow: a soft, squashed ellipse under the subject.
func ellipseShadow(width: CGFloat, squash: CGFloat, alpha: CGFloat, blur: CGFloat) -> CIImage {
  let r = width / 2
  return CIFilter(
    name: "CIRadialGradient",
    parameters: [
      "inputCenter": CIVector(x: 0, y: 0), "inputRadius0": 0, "inputRadius1": r,
      "inputColor0": CIColor(red: 0.02, green: 0.12, blue: 0.16, alpha: alpha),
      "inputColor1": CIColor(red: 0.02, green: 0.12, blue: 0.16, alpha: 0),
    ])!.outputImage!
    .cropped(to: CGRect(x: -r, y: -r, width: r * 2, height: r * 2))
    .transformed(by: CGAffineTransform(scaleX: 1, y: squash))
    .transformed(by: CGAffineTransform(translationX: size / 2, y: originY + 2))
    .applyingGaussianBlur(sigma: blur)
}
let shadow = ellipseShadow(width: drawnW * 1.05, squash: 0.09, alpha: 0.22, blur: 10)
  .composited(over: ellipseShadow(width: drawnW * 0.7, squash: 0.05, alpha: 0.3, blur: 4))

let composed = placed
  .composited(over: shadow)
  .composited(over: glow.composited(over: backdrop))
  .cropped(to: canvas)

do {
  try context.writeJPEGRepresentation(
    of: composed, to: outputURL, colorSpace: sRGB,
    options: [kCGImageDestinationLossyCompressionQuality as CIImageRepresentationOption: 0.86])
} catch {
  finish(Output(status: "skip", reason: "write failed: \(error.localizedDescription)"))
}

finish(Output(status: "ok", mode: mode.rawValue, watermarkRemoved: watermarkRemoved))
