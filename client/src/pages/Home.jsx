import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Bot, Check, ChevronRight, Instagram,
  Menu, MessageCircle, MousePointer2, Play, Sparkles, Users, X, Zap
} from 'lucide-react';

const features = [
  { icon: MessageCircle, title: 'Comment-to-DM, instantly', text: 'Turn post and reel comments into helpful, personalized conversations—without living in your inbox.' },
  { icon: Bot, title: 'Automations that feel human', text: 'Build thoughtful replies with keywords, smart delays, conditions, and AI-assisted copy.' },
  { icon: Users, title: 'Every lead, organized', text: 'Capture contact details, tag conversations, and keep your audience context in one clean workspace.' },
  { icon: BarChart3, title: 'See what moves people', text: 'Track replies, leads, and top-performing automations with clear, real-time reporting.' }
];

const plans = [
  {
    name: 'Free',
    description: 'For trying your first automation.',
    monthly: 0,
    yearly: 0,
    cta: 'Start for free',
    features: ['1 Instagram account', '2 active automations', '250 contacts', 'Basic analytics']
  },
  {
    name: 'Creator',
    description: 'For creators ready to grow consistently.',
    monthly: 19,
    yearly: 15,
    cta: 'Start Creator plan',
    popular: true,
    features: ['3 Instagram accounts', 'Unlimited automations', '5,000 contacts', 'AI-assisted replies', 'Advanced analytics']
  },
  {
    name: 'Pro',
    description: 'For teams managing serious momentum.',
    monthly: 49,
    yearly: 39,
    cta: 'Start Pro plan',
    features: ['10 Instagram accounts', 'Unlimited contacts', 'Team collaboration', 'Priority support', 'Everything in Creator']
  }
];

export default function Home() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [yearlyBilling, setYearlyBilling] = React.useState(true);

  return <div className="home-page">
    <header className="home-nav">
      <Link className="home-brand" to="/" aria-label="PingCheck home">
        <span className="home-brand-mark"><Check size={18} strokeWidth={3}/></span>
        <span>PingCheck</span>
      </Link>
      <button className="home-menu-btn" onClick={() => setMenuOpen(v => !v)} aria-label="Toggle navigation">
        {menuOpen ? <X size={22}/> : <Menu size={22}/>} 
      </button>
      <nav className={menuOpen ? 'home-links open' : 'home-links'}>
        <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
        <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
        <a href="#results" onClick={() => setMenuOpen(false)}>Results</a>
        <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
        <Link className="home-login" to="/login">Log in</Link>
        <Link className="home-nav-cta" to="/signup">Sign up <ArrowRight size={15}/></Link>
      </nav>
    </header>

    <main>
      <section className="home-hero">
        <div className="hero-glow hero-glow-one"/><div className="hero-glow hero-glow-two"/>
        <div className="hero-copy">
          <div className="home-pill"><span><Sparkles size={13}/></span> Built for Instagram growth</div>
          <h1>Turn every comment into a <em>conversation.</em></h1>
          <p>PingCheck helps creators and growing brands automate Instagram DMs, capture leads, and build genuine relationships—around the clock.</p>
          <div className="hero-actions">
            <Link className="home-btn home-btn-primary" to="/signup">Start automating free <ArrowRight size={17}/></Link>
            <a className="home-btn home-btn-quiet" href="#how-it-works"><span className="play-dot"><Play size={12} fill="currentColor"/></span> See how it works</a>
          </div>
          <div className="hero-proof">
            <div className="proof-avatars"><span>AM</span><span>JK</span><span>SL</span><span>+</span></div>
            <div><strong>Simple to set up. Easy to love.</strong><small>No credit card required · Connect in minutes</small></div>
          </div>
        </div>

        <div className="hero-product" aria-label="PingCheck product preview">
          <div className="product-window">
            <div className="product-topbar"><div className="product-logo"><Check size={13}/></div><span>PingCheck</span><div className="window-dots"><i/><i/><i/></div></div>
            <div className="product-layout">
              <aside className="product-sidebar">
                <span className="active"><Zap size={13}/> Overview</span><span><MessageCircle size={13}/> Automations</span><span><Users size={13}/> Contacts</span><span><BarChart3 size={13}/> Analytics</span>
              </aside>
              <div className="product-main">
                <div className="mock-heading"><div><small>OVERVIEW</small><strong>Good morning, Amara</strong></div><button>+ New automation</button></div>
                <div className="mock-stats"><div><small>CONVERSATIONS</small><strong>2,481</strong><span>↗ 24%</span></div><div><small>NEW LEADS</small><strong>846</strong><span>↗ 18%</span></div><div><small>REPLY RATE</small><strong>92%</strong><span>↗ 6%</span></div></div>
                <div className="mock-chart">
                  <div className="mock-chart-head"><strong>Conversation growth</strong><small>Last 7 days</small></div>
                  <svg viewBox="0 0 500 150" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e04483" stopOpacity=".25"/><stop offset="1" stopColor="#e04483" stopOpacity="0"/></linearGradient></defs><path className="chart-area" d="M0,128 C55,120 75,100 118,104 C162,107 170,72 220,80 C270,87 278,45 330,58 C384,72 410,22 500,30 L500,150 L0,150 Z"/><path className="chart-line" d="M0,128 C55,120 75,100 118,104 C162,107 170,72 220,80 C270,87 278,45 330,58 C384,72 410,22 500,30"/></svg>
                </div>
              </div>
            </div>
          </div>
          <div className="floating-comment"><span className="ig-bubble"><Instagram size={18}/></span><div><small>NEW COMMENT</small><strong>“Send me the guide!”</strong></div><span className="status-check"><Check size={13}/></span></div>
          <div className="floating-dm"><div className="dm-head"><span><Bot size={14}/></span><small>AUTOMATION SENT</small></div><p>Hey Maya! Just sent the guide to your DMs ✨</p></div>
        </div>
      </section>

      <section className="home-trust"><p>Made for the people turning an audience into a community</p><div><span>CREATORS</span><span>COACHES</span><span>E-COMMERCE</span><span>AGENCIES</span><span>EDUCATORS</span></div></section>

      <section className="home-section features-section" id="features">
        <div className="section-heading"><span className="section-kicker">GROW ON AUTOPILOT</span><h2>More connection.<br/><em>Less busywork.</em></h2><p>Everything you need to turn attention into action—without sounding like a robot or adding another task to your day.</p></div>
        <div className="feature-grid">{features.map(({icon: Icon, title, text}, i) => <article className={`feature-card feature-${i+1}`} key={title}><div className="feature-icon"><Icon size={22}/></div><h3>{title}</h3><p>{text}</p><a href="#how-it-works">Learn more <ChevronRight size={14}/></a></article>)}</div>
      </section>

      <section className="home-section steps-section" id="how-it-works">
        <div className="steps-visual">
          <div className="flow-card flow-trigger"><span><MousePointer2 size={16}/></span><div><small>WHEN THIS HAPPENS</small><strong>Someone comments “GUIDE”</strong></div><Check size={16}/></div>
          <div className="flow-line"><i/><b>in under 3 seconds</b><i/></div>
          <div className="flow-card flow-action"><span><MessageCircle size={16}/></span><div><small>PINGCHECK DOES THIS</small><strong>Sends a personalized DM</strong></div><Check size={16}/></div>
          <div className="flow-message"><div className="mini-avatar">P</div><p>Hey! Thanks for commenting 💕<br/>Here’s the guide you asked for:</p><button>Get the free guide <ArrowRight size={12}/></button></div>
        </div>
        <div className="steps-copy"><span className="section-kicker">HOW IT WORKS</span><h2>From comment to customer, <em>automatically.</em></h2><p>Build your first automation in minutes. No code, complicated logic, or awkward templates.</p><ol><li><span>01</span><div><strong>Connect your Instagram</strong><small>Securely link your professional account.</small></div></li><li><span>02</span><div><strong>Choose what starts the flow</strong><small>A comment, keyword, or message can kick things off.</small></div></li><li><span>03</span><div><strong>Write your message and go live</strong><small>Personalize the experience, then let PingCheck handle the rest.</small></div></li></ol><Link to="/signup">Build your first automation <ArrowRight size={16}/></Link></div>
      </section>

      <section className="results-section" id="results"><div className="results-copy"><span className="section-kicker light">REAL RESULTS, ON REPEAT</span><h2>Your best conversations shouldn't get lost in the comments.</h2><p>Meet people in the moment they’re most interested. PingCheck responds instantly, remembers the details, and helps you keep the conversation going.</p><div className="result-numbers"><div><strong>24/7</strong><span>your automations stay on</span></div><div><strong>&lt; 3 sec</strong><span>average first response</span></div><div><strong>1 place</strong><span>for every conversation</span></div></div></div><div className="results-orbit"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit-center"><Zap size={28}/><strong>Always on</strong><small>Growing while you create</small></div><div className="orbit-chip chip-one"><MessageCircle size={15}/> New comment</div><div className="orbit-chip chip-two"><Users size={15}/> Lead captured</div><div className="orbit-chip chip-three"><Check size={15}/> DM delivered</div></div></section>

      <section className="home-section audience-section">
        <div className="section-heading"><span className="section-kicker">MADE FOR YOUR MOMENTUM</span><h2>One platform. <em>So many ways to grow.</em></h2><p>Whether you sell products, knowledge, or creative work, PingCheck helps turn everyday engagement into meaningful action.</p></div>
        <div className="audience-grid">
          <article><span>01</span><div className="audience-icon"><Sparkles size={22}/></div><h3>Creators</h3><p>Deliver guides, links, and recommendations the moment your audience asks.</p><small>Reels · Giveaways · Lead magnets</small></article>
          <article><span>02</span><div className="audience-icon"><Users size={22}/></div><h3>Coaches</h3><p>Qualify interested followers and move warm conversations toward a booking.</p><small>Webinars · Calls · Programs</small></article>
          <article><span>03</span><div className="audience-icon"><Zap size={22}/></div><h3>Online stores</h3><p>Answer product questions and send shoppers directly to the right offer.</p><small>Launches · Drops · Support</small></article>
        </div>
      </section>

      <section className="story-section">
        <div className="story-quote"><span className="quote-mark">“</span><blockquote>PingCheck gives every person who comments a real next step. We spend less time copying links and more time creating things our audience actually wants.</blockquote><div className="story-person"><span>AR</span><div><strong>Aanya Rao</strong><small>Creator & digital educator</small></div></div></div>
        <div className="story-panel"><span className="section-kicker">THE BIG PICTURE</span><h3>Engagement is only the beginning.</h3><p>Keep the spark going after someone comments. PingCheck helps you respond, learn what they need, and build a relationship—all from one calm workspace.</p><div><span><Check size={15}/> Instant, relevant replies</span><span><Check size={15}/> Organized lead profiles</span><span><Check size={15}/> Clear performance insights</span></div></div>
      </section>

      <section className="home-section pricing-section" id="pricing">
        <div className="section-heading pricing-heading">
          <span className="section-kicker">SIMPLE, FLEXIBLE PRICING</span>
          <h2>Start free. Upgrade when <em>growth finds you.</em></h2>
          <p>Every plan includes the essentials for turning Instagram engagement into conversations. Change or cancel anytime.</p>
          <div className="billing-toggle" role="group" aria-label="Billing frequency">
            <button className={!yearlyBilling ? 'active' : ''} type="button" onClick={() => setYearlyBilling(false)}>Monthly</button>
            <button className={yearlyBilling ? 'active' : ''} type="button" onClick={() => setYearlyBilling(true)}>Yearly <span>Save 20%</span></button>
          </div>
        </div>
        <div className="pricing-grid">
          {plans.map(plan => {
            const price = yearlyBilling ? plan.yearly : plan.monthly;
            return <article className={plan.popular ? 'pricing-card featured' : 'pricing-card'} key={plan.name}>
              {plan.popular && <div className="popular-label"><Sparkles size={12}/> Most popular</div>}
              <div className="plan-top">
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
              </div>
              <div className="plan-price"><span>$</span><strong>{price}</strong><small>/ month</small></div>
              {price > 0 && <p className="billing-note">{yearlyBilling ? 'Billed annually' : 'Billed monthly'}</p>}
              {price === 0 && <p className="billing-note">Free forever</p>}
              <Link className="plan-cta" to="/signup">{plan.cta}<ArrowRight size={15}/></Link>
              <div className="plan-divider"/>
              <strong className="includes-label">What's included</strong>
              <ul>{plan.features.map(item => <li key={item}><span><Check size={12} strokeWidth={3}/></span>{item}</li>)}</ul>
            </article>;
          })}
        </div>
        <p className="pricing-footnote">All paid plans include a 14-day free trial. No credit card required.</p>
      </section>

      <section className="home-section faq-section">
        <div className="faq-intro"><span className="section-kicker">GOOD TO KNOW</span><h2>Questions,<br/><em>answered.</em></h2><p>Everything you need to know before building your first automation.</p><Link to="/signup">Get started free <ArrowRight size={15}/></Link></div>
        <div className="faq-list">
          <details open><summary>Do I need technical experience?<span>+</span></summary><p>Not at all. PingCheck uses a visual setup that guides you from trigger to reply without code.</p></details>
          <details><summary>Which Instagram accounts can connect?<span>+</span></summary><p>PingCheck is designed for Instagram Professional accounts, including Creator and Business accounts.</p></details>
          <details><summary>Can I personalize automated replies?<span>+</span></summary><p>Yes. Add names, keyword-specific messages, delays, conditions, and follow-up steps to keep conversations natural.</p></details>
          <details><summary>Can I see how my automations perform?<span>+</span></summary><p>Yes. The dashboard brings conversations, captured leads, reply rates, and automation activity together.</p></details>
        </div>
      </section>

      <section className="home-cta"><div><span className="section-kicker">READY WHEN YOU ARE</span><h2>Give every comment a <em>beautiful next step.</em></h2><p>Start building meaningful Instagram conversations today.</p><Link className="home-btn home-btn-primary" to="/signup">Start automating free <ArrowRight size={17}/></Link><small>No credit card required · Set up in minutes</small></div></section>
    </main>

    <footer className="home-footer"><Link className="home-brand" to="/"><span className="home-brand-mark"><Check size={18} strokeWidth={3}/></span><span>PingCheck</span></Link><p>Instagram conversations that grow with you.</p><div><Link to="/privacy">Privacy</Link><Link to="/login">Log in</Link><Link to="/signup">Get started</Link></div><small>© {new Date().getFullYear()} PingCheck</small></footer>
  </div>;
}
