import SwiftUI

struct UpdatePromptView: View {
    @ObservedObject private var updateManager = UpdateManager.shared
    @ObservedObject private var prefs = AppPreferences.shared
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.dismiss) private var dismiss

    private var info: DesktopVersionInfo? { updateManager.availableUpdate }
    private var latestVersion: String {
        UpdateManager.normalizedVersion(info?.latestVersion ?? UpdateManager.currentVersionString)
    }
    private var formattedSize: String? {
        guard let bytes = info?.macosSizeBytes, bytes > 0 else { return nil }
        return ByteCountFormatter.string(fromByteCount: bytes, countStyle: .file)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [prefs.currentAccentColor, prefs.currentAccentColor.opacity(0.65)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                    Text("M")
                        .font(.system(size: 20, weight: .black))
                        .foregroundColor(.white)
                }
                .frame(width: 44, height: 44)

                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 8) {
                        Text(info?.title ?? "ManiFlix Desktop v\(latestVersion)")
                            .font(.headline.weight(.bold))
                            .foregroundColor(ManiFlixTheme.primaryText(colorScheme))

                        Text(updateManager.isForceUpdate ? "Bắt buộc" : "Bản mới")
                            .font(.caption2.weight(.bold))
                            .foregroundColor(updateManager.isForceUpdate ? .red : .white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(
                                Capsule().fill(
                                    updateManager.isForceUpdate
                                        ? Color.red.opacity(0.20)
                                        : prefs.currentAccentColor.opacity(0.90)
                                )
                            )
                    }

                    Text("v\(UpdateManager.currentVersionString) (\(UpdateManager.currentBuildString)) → v\(latestVersion)")
                        .font(.caption)
                        .foregroundColor(ManiFlixTheme.secondaryText(colorScheme))
                }

                Spacer()

                if !updateManager.isForceUpdate {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title3)
                            .foregroundColor(ManiFlixTheme.secondaryText(colorScheme))
                    }
                    .buttonStyle(.plain)
                }
            }

            ScrollView {
                Text(
                    (info?.releaseNotes?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false)
                        ? (info?.releaseNotes ?? "")
                        : "Phiên bản mới đã sẵn sàng với tối ưu hiệu năng nạp phim, bộ nhớ đệm API & poster mượt mà hơn cùng nhiều cải tiến trình phát."
                )
                .font(.subheadline)
                .foregroundColor(ManiFlixTheme.primaryText(colorScheme))
                .frame(maxWidth: .infinity, alignment: .leading)
                .lineSpacing(3)
            }
            .frame(maxHeight: 150)
            .padding(12)
            .adaptiveGlassCard(cornerRadius: 12)

            VStack(spacing: 10) {
                Button {
                    updateManager.openDownload()
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "arrow.down.circle.fill")
                        Text(formattedSize.map { "Tải ManiFlix-macOS.dmg (\($0))" } ?? "Tải ManiFlix-macOS.dmg")
                    }
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 11)
                    .background(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(prefs.currentAccentColor)
                    )
                }
                .buttonStyle(.plain)

                if !updateManager.isForceUpdate {
                    Button {
                        updateManager.snoozeFor24Hours()
                        dismiss()
                    } label: {
                        Text("Nhắc lại sau 24 giờ")
                            .font(.subheadline.weight(.medium))
                            .foregroundColor(ManiFlixTheme.primaryText(colorScheme))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 9)
                    }
                    .buttonStyle(.plain)
                    .adaptiveGlassCapsule(interactive: true)
                }
            }
        }
        .padding(22)
        .frame(width: 460)
        .background(ManiFlixTheme.background(scheme: colorScheme))
        .interactiveDismissDisabled(updateManager.isForceUpdate)
    }
}
