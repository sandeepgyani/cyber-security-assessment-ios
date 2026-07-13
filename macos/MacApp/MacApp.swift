import SwiftUI
import WebKit

@main
struct MacApp: App {
    var body: some Scene {
        WindowGroup("Cyber Security Assessment") {
            WebView()
                .frame(minWidth: 1100, minHeight: 720)
        }
    }
}

struct WebView: NSViewRepresentable {
    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        let webView = WKWebView(frame: .zero, configuration: config)
        if let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "www") ??
                     Bundle.main.url(forResource: "index", withExtension: "html") {
            webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
        return webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {}
}
