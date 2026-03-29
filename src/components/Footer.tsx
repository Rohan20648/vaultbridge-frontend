const Footer = () => (
  <footer className="border-t border-border/50 py-12 mt-20">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-lg font-bold mb-3">
            <span className="gradient-text">Vault</span>Bridge
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The premier incubation platform connecting visionary founders with strategic investors.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3 text-foreground">Platform</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Startups</p><p>Investors</p><p>Deals</p><p>Incubation</p>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3 text-foreground">Resources</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Documentation</p><p>Blog</p><p>Case Studies</p><p>API</p>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3 text-foreground">Legal</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Privacy Policy</p><p>Terms of Service</p><p>Cookie Policy</p>
          </div>
        </div>
      </div>
      <div className="mt-10 pt-6 border-t border-border/30 text-center text-xs text-muted-foreground">
        © 2026 VaultBridge Incubator. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
