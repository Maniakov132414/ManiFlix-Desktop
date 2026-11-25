import SwiftUI
import AppKit
import Darwin

struct DeviceMonitorView: View {
    @ObservedObject private var prefs = AppPreferences.shared
    @Environment(\.colorScheme) private var colorScheme

    @State private var liveProbeEnabled = true
    @State private var isTesting = false
    @State private var dlMbps: Double = 0
    @State private var ulMbps: Double = 0
    @State private var pingMs: Double = 0
    @State private var jitterMs: Double = 0
    @State private var netStats: NetStatsResponse?
    @State private var dlHistory: [Double] = []
    @State private var ulHistory: [Double] = []
    @State private var pingHistory: [Double] = []
    @State private var serverCpuHistory: [Double] = []
    @State private var appRssMB: Double = 0

    private let cpuBrand = Self.sysctlString("machdep.cpu.brand_string") ?? Self.sysctlString("hw.model") ?? "Apple Silicon / Mac"
    private let hwModel = Self.sysctlString("hw.model") ?? "Mac"
    private let physicalRamGB = Double(ProcessInfo.processInfo.physicalMemory) / 1_073_741_824.0
    private let cpuCores = ProcessInfo.processInfo.processorCount

    private var capacityScore: Int {
        let dlScore = min(55.0, dlMbps * 1.4)
        let pingScore = max(0.0, 25.0 - min(25.0, pingMs / 6.0))
        let hwScore = min(20.0, Double(cpuCores) * 2.0)
        return min(100, Int((dlScore + pingScore + hwScore).rounded()))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 10) {
                    Text("LIVE").font(.caption2.bold()).foregroundColor(.green)
                        .padding(.horizontal, 8).padding(.vertical, 4)
                        .adaptiveGlassCapsule(interactive: false)
                    Spacer()
                    Toggle("Live Probe", isOn: $liveProbeEnabled).toggleStyle(.switch).labelsHidden()
                    Text(liveProbeEnabled ? "Live Probe: BẬT" : "Live Probe: TẮT").font(.caption)
                    Button(isTesting ? "Đang đo..." : "Đo Speedtest Ngay") {
                        Task { await runSample(runProbe: true) }
                    }
                    .buttonStyle(.borderedProminent).tint(prefs.currentAccentColor)
                    .disabled(isTesting)
                }

                LazyVGrid(columns: [GridItem(.adaptive(minimum: 155), spacing: 10)], spacing: 10) {
                    kpiCard(title: "Tải xuống", value: String(format: "%.1f Mbps", dlMbps), color: .green)
                    kpiCard(title: "Tải lên", value: String(format: "%.1f Mbps", ulMbps), color: .blue)
                    kpiCard(title: "Ping / Jitter", value: "\(Int(pingMs)) / \(Int(jitterMs)) ms", color: .orange)
                    kpiCard(title: "RAM Tiến trình", value: String(format: "%.0f MB", appRssMB), color: prefs.currentAccentColor)
                }

                HStack(spacing: 12) {
                    chartBox(title: "Tải xuống / Tải lên (Mbps)", a: dlHistory, b: ulHistory, colorA: .green, colorB: .blue)
                    chartBox(title: "Ping (ms) & Server CPU (%)", a: pingHistory, b: serverCpuHistory, colorA: .orange, colorB: .red)
                }

                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Text("Sức Tải Tối Đa Của Máy & Mạng").font(.headline)
                        Spacer()
                        Text("\(capacityScore)%").font(.headline).foregroundColor(prefs.currentAccentColor)
                    }
                    ProgressView(value: Double(capacityScore), total: 100).tint(prefs.currentAccentColor)
                    HStack(spacing: 8) {
                        tierBadge("720p HD", active: dlMbps >= 5)
                        tierBadge("1080p60 FHD", active: dlMbps >= 12)
                        tierBadge("2K / 4K HDR", active: dlMbps >= 28 && physicalRamGB >= 8)
                    }
                }
                .padding(14).adaptiveGlassCard(cornerRadius: 14)

                HStack(alignment: .top, spacing: 12) {
                    hardwareCard
                    networkCard
                }
            }
            .padding(20)
        }
        .background(ManiFlixTheme.background(scheme: colorScheme).ignoresSafeArea())
        .navigationTitle("Kiểm tra mạng & Thiết bị")
        .task {
            await runSample(runProbe: true)
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 2_500_000_000)
                if Task.isCancelled { break }
                await runSample(runProbe: liveProbeEnabled)
            }
        }
    }

    private func kpiCard(title: String, value: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.caption).foregroundColor(ManiFlixTheme.secondaryText(colorScheme))
            Text(value).font(.title3.bold()).foregroundColor(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .adaptiveGlassCard(cornerRadius: 13)
    }

    private func chartBox(title: String, a: [Double], b: [Double], colorA: Color, colorB: Color) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.caption.weight(.semibold)).foregroundColor(ManiFlixTheme.primaryText(colorScheme))
            Canvas { ctx, size in
                let maxVal = max(10.0, (a + b).max() ?? 10.0)
                for i in 1..<4 {
                    let y = size.height * CGFloat(i) / 4.0
                    var grid = Path()
                    grid.move(to: CGPoint(x: 0, y: y))
                    grid.addLine(to: CGPoint(x: size.width, y: y))
                    ctx.stroke(grid, with: .color(.gray.opacity(0.18)), lineWidth: 1)
                }
                func draw(_ arr: [Double], _ col: Color) {
                    guard arr.count >= 2 else { return }
                    var p = Path()
                    for (idx, val) in arr.enumerated() {
                        let x = CGFloat(idx) / CGFloat(max(1, arr.count - 1)) * (size.width - 8) + 4
                        let y = size.height - 8 - CGFloat(val / maxVal) * (size.height - 16)
                        if idx == 0 { p.move(to: CGPoint(x: x, y: y)) } else { p.addLine(to: CGPoint(x: x, y: y)) }
                    }
                    ctx.stroke(p, with: .color(col), lineWidth: 2)
                }
                draw(a, colorA)
                draw(b, colorB)
            }
            .frame(height: 120)
        }
        .padding(12).frame(maxWidth: .infinity).adaptiveGlassCard(cornerRadius: 14)
    }

    private func tierBadge(_ text: String, active: Bool) -> some View {
        Text("\(text) \(active ? "✓" : "•")")
            .font(.caption.weight(.semibold))
            .foregroundColor(active ? .white : ManiFlixTheme.secondaryText(colorScheme))
            .padding(.horizontal, 10).padding(.vertical, 5)
            .adaptiveGlassCapsule(interactive: false, tint: active ? prefs.currentAccentColor : nil)
    }

    private var hardwareCard: some View {
        let screen = NSScreen.main
        let hz = screen?.maximumFramesPerSecond ?? 60
        let res = screen.map { "\(Int($0.frame.width))×\(Int($0.frame.height))" } ?? "Mac Display"
        let disk = Self.diskInfo()
        return VStack(alignment: .leading, spacing: 8) {
            Text("Phần cứng Mac").font(.headline)
            specRow("Model", hwModel)
            specRow("CPU", "\(cpuBrand) (\(cpuCores) nhân)")
            specRow("macOS", ProcessInfo.processInfo.operatingSystemVersionString)
            specRow("RAM", String(format: "%.1f GB (App %.0f MB)", physicalRamGB, appRssMB))
            specRow("Ổ đĩa", disk)
            specRow("Màn hình", "\(res) • \(hz) Hz")
        }
        .padding(14).frame(maxWidth: .infinity, alignment: .leading).adaptiveGlassCard(cornerRadius: 14)
    }

    private var networkCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Máy chủ (phim.maniakov.bond)").font(.headline)
            specRow("Trạng thái", (netStats?.ok ?? false) ? "Trực tuyến (OK)" : "Đang kết nối...")
            specRow("Server RX / TX", String(format: "%.2f / %.2f Mbps", netStats?.rxMbps ?? 0, netStats?.txMbps ?? 0))
            specRow("Peak RX / TX", String(format: "%.2f / %.2f Mbps", netStats?.peakRxMbps ?? 0, netStats?.peakTxMbps ?? 0))
            specRow("Server CPU / RAM", String(format: "%.1f%% / %.1f%%", netStats?.cpuPct ?? 0, netStats?.memPct ?? 0))
            specRow("Active Requests", "\(netStats?.activeRequests ?? 0)")
            specRow("Uptime", "\(Int((netStats?.uptimeSec ?? 0) / 60)) phút")
        }
        .padding(14).frame(maxWidth: .infinity, alignment: .leading).adaptiveGlassCard(cornerRadius: 14)
    }

    private func specRow(_ k: String, _ v: String) -> some View {
        HStack {
            Text(k).font(.caption).foregroundColor(ManiFlixTheme.secondaryText(colorScheme))
            Spacer()
            Text(v).font(.caption.weight(.semibold)).foregroundColor(ManiFlixTheme.primaryText(colorScheme)).lineLimit(1)
        }
    }

    private func runSample(runProbe: Bool) async {
        isTesting = true
        appRssMB = Self.currentProcessRSSMB()
        let t0 = CFAbsoluteTimeGetCurrent()
        if let stats = try? await ManiFlixAPI.shared.fetchNetStats() {
            self.netStats = stats
            let elapsed = max(1.0, (CFAbsoluteTimeGetCurrent() - t0) * 1000.0)
            let prev = self.pingMs > 0 ? self.pingMs : elapsed
            self.jitterMs = abs(elapsed - prev)
            self.pingMs = elapsed
        }
        if runProbe {
            if let dl = try? await ManiFlixAPI.shared.measureDownloadProbe(kb: 256) {
                self.dlMbps = dl.mbps
            }
            if let ul = try? await ManiFlixAPI.shared.measureUploadProbe(bytesCount: 128 * 1024) {
                self.ulMbps = ul
            }
        }
        dlHistory.append(dlMbps); if dlHistory.count > 24 { dlHistory.removeFirst() }
        ulHistory.append(ulMbps); if ulHistory.count > 24 { ulHistory.removeFirst() }
        pingHistory.append(pingMs); if pingHistory.count > 24 { pingHistory.removeFirst() }
        serverCpuHistory.append(netStats?.cpuPct ?? 0); if serverCpuHistory.count > 24 { serverCpuHistory.removeFirst() }
        isTesting = false
    }

    static func sysctlString(_ key: String) -> String? {
        var size = 0
        guard sysctlbyname(key, nil, &size, nil, 0) == 0, size > 0 else { return nil }
        var buf = [CChar](repeating: 0, count: size)
        guard sysctlbyname(key, &buf, &size, nil, 0) == 0 else { return nil }
        return String(cString: buf)
    }

    static func currentProcessRSSMB() -> Double {
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size) / 4
        let kerr = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
                task_info(mach_task_self_, task_flavor_t(MACH_TASK_BASIC_INFO), $0, &count)
            }
        }
        guard kerr == KERN_SUCCESS else { return 0 }
        return Double(info.resident_size) / (1024.0 * 1024.0)
    }

    static func diskInfo() -> String {
        let url = URL(fileURLWithPath: "/")
        let vals = try? url.resourceValues(forKeys: [.volumeAvailableCapacityForImportantUsageKey, .volumeTotalCapacityKey])
        let free = Double(vals?.volumeAvailableCapacityForImportantUsage ?? 0) / 1_073_741_824.0
        let total = Double(vals?.volumeTotalCapacity ?? 0) / 1_073_741_824.0
        return String(format: "Trống %.0f / %.0f GB", free, total)
    }
}
