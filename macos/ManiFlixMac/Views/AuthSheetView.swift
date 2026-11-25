import SwiftUI

struct AuthSheetView: View {
    @ObservedObject private var appState = AppState.shared
    @ObservedObject private var prefs = AppPreferences.shared
    @Environment(\.dismiss) private var dismiss

    @State private var isRegisterMode = false
    @State private var username = ""
    @State private var password = ""
    @State private var displayName = ""
    @State private var isBusy = false
    @State private var errorText: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("Tài khoản ManiFlix").font(.headline)
                Spacer()
                Button("Đóng") { dismiss() }
            }

            if appState.isLoggedIn, let user = appState.currentUser {
                VStack(alignment: .leading, spacing: 6) {
                    Text(user.displayName ?? user.username).font(.title3.bold())
                    Text("@\(user.username)").foregroundColor(.secondary)
                    Text("Lịch sử xem: \(appState.history.count) • Đã lưu: \(appState.favorites.count)").font(.caption)
                }
                .padding().frame(maxWidth: .infinity, alignment: .leading)
                .adaptiveGlassCard(cornerRadius: 12)

                HStack {
                    Button("Đồng bộ dữ liệu") { Task { await appState.refreshLibrary() } }
                    Spacer()
                    Button("Đăng xuất", role: .destructive) { appState.logout(); dismiss() }
                }
            } else {
                Picker("Chế độ", selection: $isRegisterMode) {
                    Text("Đăng nhập").tag(false)
                    Text("Đăng ký").tag(true)
                }
                .pickerStyle(.segmented)

                TextField("Tên đăng nhập", text: $username).textFieldStyle(.roundedBorder)
                if isRegisterMode {
                    TextField("Tên hiển thị", text: $displayName).textFieldStyle(.roundedBorder)
                }
                SecureField("Mật khẩu", text: $password).textFieldStyle(.roundedBorder)

                if let err = errorText {
                    Text(err).font(.caption).foregroundColor(.red)
                }

                Button {
                    Task { await submit() }
                } label: {
                    HStack {
                        Spacer()
                        if isBusy { ProgressView() }
                        else { Text(isRegisterMode ? "Tạo tài khoản" : "Đăng nhập").bold() }
                        Spacer()
                    }
                    .padding(.vertical, 8)
                }
                .buttonStyle(.borderedProminent)
                .tint(prefs.currentAccentColor)
                .disabled(isBusy || username.isEmpty || password.isEmpty)
            }
        }
        .padding(22)
        .frame(width: 360)
        .preferredColorScheme(prefs.resolvedColorScheme)
    }

    private func submit() async {
        isBusy = true; errorText = nil
        do {
            let res: AuthResponse = isRegisterMode
                ? try await ManiFlixAPI.shared.register(username: username.trimmingCharacters(in: .whitespaces), password: password, displayName: displayName.isEmpty ? username : displayName)
                : try await ManiFlixAPI.shared.login(username: username.trimmingCharacters(in: .whitespaces), password: password)
            if let token = res.token, !token.isEmpty {
                await appState.handleAuthSuccess(token: token, user: res.user)
                dismiss()
            } else {
                errorText = res.error ?? "Không thể xác thực tài khoản."
            }
        } catch {
            errorText = error.localizedDescription
        }
        isBusy = false
    }
}
