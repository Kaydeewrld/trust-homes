function SiteFooter() {
  return (
    <footer className="border-t border-white/15 bg-gradient-to-b from-[#071a4a] via-[#06153d] to-[#040c25] px-4 py-8 text-blue-100/80 md:px-6">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="grid gap-5 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur md:grid-cols-[1.2fr_1fr_1fr_1fr] md:p-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/10">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor">
                  <path d="M3 10.5 12 3l9 7.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 9v11h12V9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-white">TrustedHome</p>
            </div>
            <p className="mt-3 max-w-sm text-sm text-blue-100/75">
              Premium real estate discovery for buying, renting, and leasing verified properties across top locations.
            </p>
            <div className="mt-4 flex gap-2">
              {['f', 'x', 'in', 'ig'].map((item) => (
                <button key={item} type="button" className="grid h-8 w-8 place-items-center rounded-lg border border-white/20 bg-white/10 text-xs text-blue-100 hover:bg-white/20">
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Company</p>
            <div className="mt-3 space-y-2 text-sm">
              <a href="#" className="block hover:text-white">About Us</a>
              <a href="#" className="block hover:text-white">Our Agents</a>
              <a href="#" className="block hover:text-white">Careers</a>
              <a href="#" className="block hover:text-white">Contact</a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Explore</p>
            <div className="mt-3 space-y-2 text-sm">
              <a href="#" className="block hover:text-white">Properties</a>
              <a href="#" className="block hover:text-white">Auctions</a>
              <a href="#" className="block hover:text-white">Home Loans</a>
              <a href="#" className="block hover:text-white">Neighborhoods</a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Stay Updated</p>
            <p className="mt-3 text-sm text-blue-100/75">Get latest listings and market updates every week.</p>
            <div className="mt-3 flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-blue-100/55 outline-none"
              />
              <button type="button" className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-400">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 text-xs md:flex-row md:items-center md:justify-between">
          <p>© 2026 TrustedHome. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Support</a>
            <a href="#" className="hover:text-white">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
