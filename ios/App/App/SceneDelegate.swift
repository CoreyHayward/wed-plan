import UIKit
import Capacitor
import WebKit

private enum WedPlanTheme: String {
    static let defaultsKey = "wedPlanTheme"

    case system
    case light
    case dark

    static var saved: WedPlanTheme {
        guard let value = UserDefaults.standard.string(forKey: defaultsKey),
              let theme = WedPlanTheme(rawValue: value) else {
            return .system
        }
        return theme
    }

    var interfaceStyle: UIUserInterfaceStyle {
        switch self {
        case .system:
            return .unspecified
        case .light:
            return .light
        case .dark:
            return .dark
        }
    }
}

private extension UIColor {
    static let wedPlanBackground = UIColor { traits in
        if traits.userInterfaceStyle == .dark {
            return UIColor(red: 18.0 / 255.0,
                           green: 16.0 / 255.0,
                           blue: 14.0 / 255.0,
                           alpha: 1)
        }

        return UIColor(red: 250.0 / 255.0,
                       green: 249.0 / 255.0,
                       blue: 247.0 / 255.0,
                       alpha: 1)
    }
}

private final class WeakScriptMessageHandler: NSObject, WKScriptMessageHandler {
    weak var delegate: WKScriptMessageHandler?

    init(delegate: WKScriptMessageHandler) {
        self.delegate = delegate
    }

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        delegate?.userContentController(userContentController, didReceive: message)
    }
}

final class WedPlanBridgeViewController: CAPBridgeViewController, WKScriptMessageHandler {
    private static let serverURLKey = "wedPlanServerURL"
    private static let messageHandlerName = "wedPlanSettings"

    override func instanceDescriptor() -> InstanceDescriptor {
        let descriptor = super.instanceDescriptor()
        descriptor.backgroundColor = .wedPlanBackground

        if let configuredURL = Self.savedServerURL() {
            descriptor.serverURL = configuredURL.absoluteString
        }

        return descriptor
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        switch WedPlanTheme.saved {
        case .dark:
            return .lightContent
        case .light:
            return .darkContent
        case .system:
            return traitCollection.userInterfaceStyle == .dark
                ? .lightContent
                : .darkContent
        }
    }

    override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)

        if WedPlanTheme.saved == .system {
            setNeedsStatusBarAppearanceUpdate()
        }
    }

    override func capacitorDidLoad() {
        super.capacitorDidLoad()

        guard let contentController = webView?.configuration.userContentController else {
            return
        }

        let handler = WeakScriptMessageHandler(delegate: self)
        contentController.add(handler, name: Self.messageHandlerName)

        let currentURL = Self.savedServerURL()?.absoluteString ?? ""
        let encodedURL = Self.javaScriptString(currentURL)
        contentController.addUserScript(
            WKUserScript(
                source: "window.__WED_PLAN_SERVER_URL__ = \(encodedURL);",
                injectionTime: .atDocumentStart,
                forMainFrameOnly: true
            )
        )

        if let route = Self.launchRoute(), route != "/" {
            let encodedRoute = Self.javaScriptString(route)
            contentController.addUserScript(
                WKUserScript(
                    source: """
                    (() => {
                      const route = \(encodedRoute);
                      if (window.location.protocol === "http:" || window.location.protocol === "https:") {
                        const launchKey = "__wedPlanLaunchRoute";
                        const destination = new URL(route, window.location.origin).href;
                        if (window.sessionStorage.getItem(launchKey) !== route) {
                          window.sessionStorage.setItem(launchKey, route);
                          if (window.location.href !== destination) {
                            window.location.replace(destination);
                          }
                        }
                      }
                    })();
                    """,
                    injectionTime: .atDocumentStart,
                    forMainFrameOnly: true
                )
            )
        }
    }

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard message.name == Self.messageHandlerName,
              let body = message.body as? [String: Any],
              let action = body["action"] as? String else {
            return
        }

        switch action {
        case "setServerURL":
            updateServerURL(from: body)
        case "setTheme":
            updateTheme(from: body)
        default:
            return
        }
    }

    private func updateServerURL(from body: [String: Any]) {
        guard let rawURL = body["url"] as? String,
              let serverURL = Self.validServerURL(rawURL) else {
            notifyConfigurationError("Enter a full http:// or https:// server URL.")
            return
        }

        UserDefaults.standard.set(serverURL.absoluteString, forKey: Self.serverURLKey)

        DispatchQueue.main.async { [weak self] in
            guard let window = self?.view.window else { return }
            window.rootViewController = WedPlanBridgeViewController()
        }
    }

    private func updateTheme(from body: [String: Any]) {
        guard let rawTheme = body["theme"] as? String,
              let theme = WedPlanTheme(rawValue: rawTheme) else {
            return
        }

        UserDefaults.standard.set(theme.rawValue, forKey: WedPlanTheme.defaultsKey)

        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.view.window?.overrideUserInterfaceStyle = theme.interfaceStyle
            self.view.backgroundColor = .wedPlanBackground
            self.webView?.backgroundColor = .wedPlanBackground
            self.webView?.scrollView.backgroundColor = .wedPlanBackground
            self.setNeedsStatusBarAppearanceUpdate()
        }
    }

    private func notifyConfigurationError(_ message: String) {
        let encodedMessage = Self.javaScriptString(message)
        webView?.evaluateJavaScript(
            "window.wedPlanConfigurationError?.(\(encodedMessage));"
        )
    }

    private static func savedServerURL() -> URL? {
        guard let value = UserDefaults.standard.string(forKey: serverURLKey) else {
            return nil
        }
        return validServerURL(value)
    }

    private static func validServerURL(_ value: String) -> URL? {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard var components = URLComponents(string: trimmed),
              components.scheme == "http" || components.scheme == "https",
              components.host != nil else {
            return nil
        }

        components.path = components.path.replacingOccurrences(
            of: "/+$",
            with: "",
            options: .regularExpression
        )
        return components.url
    }

    private static func launchRoute() -> String? {
        let arguments = ProcessInfo.processInfo.arguments
        guard let flagIndex = arguments.firstIndex(of: "--route"),
              arguments.indices.contains(flagIndex + 1) else {
            return nil
        }

        let route = arguments[flagIndex + 1]
        guard route.hasPrefix("/"), !route.hasPrefix("//") else {
            return nil
        }
        return route
    }

    private static func javaScriptString(_ value: String) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: [value]),
              let array = String(data: data, encoding: .utf8) else {
            return "\"\""
        }
        return String(array.dropFirst().dropLast())
    }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.overrideUserInterfaceStyle = WedPlanTheme.saved.interfaceStyle
        window?.backgroundColor = .wedPlanBackground
        window?.rootViewController = WedPlanBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
