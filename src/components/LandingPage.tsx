import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  ArrowRight, 
  Play, 
  CheckCircle, 
  Star,
  Users,
  Building2,
  Calendar,
  BarChart3,
  Workflow,
  Shield,
  Zap,
  Github,
  Mail,
  Globe,
  Target,
  TrendingUp,
  Clock,
  Sparkles,
  Eye,
  Database,
  Video,
  Image,
  Layers,
  Settings,
  Rocket,
  Heart,
  Award,
  Quote
} from 'lucide-react';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
}

interface TestimonialProps {
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
}

interface PricingPlanProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  buttonAction: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, gradient }) => (
  <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-gray-200 hover:-translate-y-2">
    <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-6`}>
      <Icon size={28} className="text-white" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-primary transition-colors duration-300">
      {title}
    </h3>
    <p className="text-gray-600 leading-relaxed">
      {description}
    </p>
  </div>
);

const TestimonialCard: React.FC<TestimonialProps> = ({ name, role, company, content, rating }) => (
  <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 h-full">
    <div className="flex items-center gap-1 mb-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star 
          key={i} 
          size={20} 
          className={i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
        />
      ))}
    </div>
    <Quote className="w-8 h-8 text-gray-300 mb-4" />
    <p className="text-gray-700 text-lg leading-relaxed mb-6">
      "{content}"
    </p>
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold text-lg">
        {name.charAt(0)}
      </div>
      <div>
        <h4 className="font-bold text-gray-900">{name}</h4>
        <p className="text-gray-600 text-sm">{role} at {company}</p>
      </div>
    </div>
  </div>
);

const PricingCard: React.FC<PricingPlanProps> = ({ 
  name, 
  price, 
  period, 
  description, 
  features, 
  popular, 
  buttonText, 
  buttonAction 
}) => (
  <div className={`relative bg-white rounded-2xl p-8 shadow-lg border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
    popular ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-gray-200'
  }`}>
    {popular && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
        <span className="bg-gradient-to-r from-primary to-accent text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
          Most Popular
        </span>
      </div>
    )}
    
    <div className="text-center mb-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      <div className="mb-6">
        <span className="text-5xl font-bold text-gray-900">{price}</span>
        <span className="text-gray-600 text-lg">/{period}</span>
      </div>
    </div>

    <ul className="space-y-4 mb-8">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center gap-3">
          <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
          <span className="text-gray-700">{feature}</span>
        </li>
      ))}
    </ul>

    <button
      onClick={buttonAction}
      className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
        popular
          ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl hover:scale-105'
          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
      }`}
    >
      {buttonText}
    </button>
  </div>
);

export function LandingPage() {
  const [showDemo, setShowDemo] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  const features = [
    {
      icon: BarChart3,
      title: "Comprehensive Dashboard",
      description: "Get real-time insights with customizable dashboards showing project progress, team workload, client statistics, and key performance metrics at a glance.",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      icon: Workflow,
      title: "Visual Workflow Builder",
      description: "Design and automate complex business processes with our intuitive drag-and-drop workflow builder. Create, manage, and track workflows from start to finish.",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      icon: Layers,
      title: "Kanban Task Management",
      description: "Organize work with powerful Kanban boards featuring drag-and-drop task management, priority levels, due dates, and team member assignments.",
      gradient: "from-green-500 to-green-600"
    },
    {
      icon: Building2,
      title: "Advanced CRM",
      description: "Manage client relationships with comprehensive profiles, project tracking, communication logs, and automated workflow generation for new clients.",
      gradient: "from-orange-500 to-orange-600"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Streamline teamwork with role-based access control, workload tracking, performance analytics, and capacity planning tools.",
      gradient: "from-pink-500 to-pink-600"
    },
    {
      icon: Calendar,
      title: "Meeting Management",
      description: "Schedule, track, and manage client meetings with calendar integration, automated reminders, and meeting minutes functionality.",
      gradient: "from-indigo-500 to-indigo-600"
    },
    {
      icon: Shield,
      title: "Multi-Auth Security",
      description: "Enterprise-grade security with email/password, magic links, Google OAuth, and GitHub OAuth authentication options.",
      gradient: "from-red-500 to-red-600"
    },
    {
      icon: Database,
      title: "Multi-Workspace Support",
      description: "Organize work across multiple workspaces with isolated data, team management, and customizable access controls.",
      gradient: "from-teal-500 to-teal-600"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Project Manager", 
      company: "TechCorp Inc",
      avatar: "SJ",
      content: "Benders Workflow transformed how we manage projects. The visual workflows and Kanban boards make everything so much clearer for our team.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Operations Director",
      company: "Growth Partners",
      avatar: "MC", 
      content: "The client management features are incredible. We can track every project, meeting, and deliverable in one place. Our productivity increased by 40%.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Team Lead",
      company: "Creative Solutions",
      avatar: "ER",
      content: "Love the multi-auth options and workspace management. Our distributed team can collaborate seamlessly across different projects and clients.",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$29",
      period: "month",
      description: "Perfect for small teams getting started",
      features: [
        "Up to 5 team members",
        "3 workspaces",
        "Basic workflow templates",
        "Kanban boards",
        "Client management",
        "Email support"
      ],
      buttonText: "Start Free Trial",
      buttonAction: () => navigate('/login')
    },
    {
      name: "Professional", 
      price: "$79",
      period: "month",
      description: "For growing teams and businesses",
      features: [
        "Up to 25 team members", 
        "Unlimited workspaces",
        "Advanced workflows",
        "Custom dashboard",
        "Meeting management",
        "Priority support",
        "API access"
      ],
      popular: true,
      buttonText: "Get Started",
      buttonAction: () => navigate('/login')
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "month", 
      description: "For large organizations",
      features: [
        "Unlimited team members",
        "Advanced security",
        "Custom integrations", 
        "Dedicated support",
        "SLA guarantee",
        "Custom training",
        "On-premise deployment"
      ],
      buttonText: "Contact Sales",
      buttonAction: () => window.open('mailto:sales@bendersworkflow.com', '_blank')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-accent to-secondary">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/20 pointer-events-none"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-tertiary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 px-6 py-20 lg:py-32">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-white">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-6 h-6 text-tertiary" />
                  <span className="text-tertiary font-semibold">Next-Generation Business Management</span>
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                  Streamline Your
                  <span className="block bg-gradient-to-r from-tertiary to-white bg-clip-text text-transparent">
                    Workflow
                  </span>
                </h1>
                
                <p className="text-xl lg:text-2xl text-white/90 mb-8 leading-relaxed">
                  The complete business process management platform that combines workflow automation, 
                  project management, CRM, and team collaboration in one powerful solution.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  {isLoading ? (
                    <button disabled className="flex items-center justify-center gap-3 px-8 py-4 bg-gray-400 text-white rounded-2xl font-bold text-lg">
                      <Clock className="w-6 h-6 animate-spin" />
                      Loading...
                    </button>
                  ) : isAuthenticated ? (
                    <button 
                      onClick={() => navigate('/app/dashboard')}
                      className="flex items-center justify-center gap-3 px-8 py-4 bg-tertiary hover:bg-tertiary/90 text-primary rounded-2xl font-bold text-lg transition-all duration-200 shadow-2xl hover:scale-105"
                    >
                      <Target className="w-6 h-6" />
                      Go to Dashboard
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => navigate('/login')}
                      className="flex items-center justify-center gap-3 px-8 py-4 bg-tertiary hover:bg-tertiary/90 text-primary rounded-2xl font-bold text-lg transition-all duration-200 shadow-2xl hover:scale-105"
                    >
                      <Rocket className="w-6 h-6" />
                      Start Free Trial
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
                  
                  <button 
                    onClick={() => setShowDemo(true)}
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-2xl font-semibold text-lg transition-all duration-200 backdrop-blur-sm"
                  >
                    <Play className="w-6 h-6" />
                    Watch Demo
                  </button>
                </div>
                
                <div className="flex items-center gap-8 text-white/80">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>14-day free trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                {/* Video/Screenshot Placeholder */}
                <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
                  <div className="aspect-video bg-gray-900/50 rounded-2xl flex items-center justify-center mb-6">
                    <div className="text-center text-white/70">
                      <Video className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-lg font-semibold">Product Demo Video</p>
                      <p className="text-sm">Interactive workflow demonstration</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="aspect-video bg-gray-900/30 rounded-xl flex items-center justify-center">
                      <div className="text-center text-white/60">
                        <Image className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-xs">Dashboard View</p>
                      </div>
                    </div>
                    <div className="aspect-video bg-gray-900/30 rounded-xl flex items-center justify-center">
                      <div className="text-center text-white/60">
                        <Image className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-xs">Kanban Board</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute -top-4 -left-4 w-20 h-20 bg-tertiary/20 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/20 rounded-full blur-lg animate-pulse delay-1000"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-gray-600 font-semibold mb-4">Trusted by teams at</p>
            <div className="flex items-center justify-center gap-12 opacity-60">
              {/* Company logos placeholder */}
              <div className="w-32 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 font-semibold">Company 1</span>
              </div>
              <div className="w-32 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 font-semibold">Company 2</span>
              </div>
              <div className="w-32 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 font-semibold">Company 3</span>
              </div>
              <div className="w-32 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 font-semibold">Company 4</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Target className="w-8 h-8 text-primary" />
              <span className="text-primary font-bold text-lg">Core Features</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Everything You Need to
              <span className="block text-primary">Succeed</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From workflow automation to team collaboration, we've built every feature 
              your business needs to operate efficiently and scale successfully.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </div>

      {/* Workflow Demo Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Workflow className="w-8 h-8 text-primary" />
                <span className="text-primary font-bold text-lg">Visual Workflow Builder</span>
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Design Processes
                <span className="block text-primary">Visually</span>
              </h2>
              
              <p className="text-xl text-gray-600 mb-8">
                Create complex business processes with our intuitive drag-and-drop interface. 
                No coding required - just point, click, and connect.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700 text-lg">Drag-and-drop workflow builder</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700 text-lg">Pre-built workflow templates</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700 text-lg">Real-time collaboration</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700 text-lg">Automated task assignment</span>
                </div>
              </div>
              
              <button className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-accent text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                <Eye className="w-6 h-6" />
                See It In Action
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative">
              {/* Workflow Builder Screenshot Placeholder */}
              <div className="bg-gray-100 rounded-3xl p-8 shadow-2xl">
                <div className="aspect-video bg-white rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center text-gray-500">
                    <Settings className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-lg font-semibold">Workflow Builder Screenshot</p>
                    <p className="text-sm">Interactive process design interface</p>
                  </div>
                </div>
              </div>
              
              {/* Floating workflow nodes */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary rounded-xl shadow-lg flex items-center justify-center">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div className="absolute top-1/2 -left-4 w-12 h-12 bg-accent rounded-lg shadow-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Demo Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="lg:order-2">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-8 h-8 text-primary" />
                <span className="text-primary font-bold text-lg">Smart Analytics</span>
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Insights That
                <span className="block text-primary">Drive Growth</span>
              </h2>
              
              <p className="text-xl text-gray-600 mb-8">
                Get real-time visibility into your business performance with comprehensive 
                dashboards and detailed analytics across all your projects and teams.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700 text-lg">Real-time performance metrics</span>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700 text-lg">Customizable dashboards</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700 text-lg">Time tracking and reporting</span>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-6 h-6 text-green-500" />
                  <span className="text-gray-700 text-lg">Team performance analytics</span>
                </div>
              </div>
            </div>
            
            <div className="lg:order-1 relative">
              {/* Dashboard Screenshot Placeholder */}
              <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-200">
                <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-lg font-semibold">Dashboard Screenshot</p>
                    <p className="text-sm">Real-time analytics and metrics</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Shield className="w-8 h-8 text-primary" />
              <span className="text-primary font-bold text-lg">Enterprise Security</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Multiple Ways to
              <span className="block text-primary">Stay Secure</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
              Choose from multiple authentication methods that work best for your team, 
              with enterprise-grade security built into every layer.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-8 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors duration-200">
              <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Email & Password</h3>
              <p className="text-gray-600">Traditional secure login with encrypted passwords</p>
            </div>
            
            <div className="text-center p-8 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors duration-200">
              <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Magic Links</h3>
              <p className="text-gray-600">Passwordless authentication via email</p>
            </div>
            
            <div className="text-center p-8 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors duration-200">
              <Globe className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Google OAuth</h3>
              <p className="text-gray-600">Single sign-on with Google accounts</p>
            </div>
            
            <div className="text-center p-8 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors duration-200">
              <Github className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">GitHub OAuth</h3>
              <p className="text-gray-600">Seamless integration for development teams</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Heart className="w-8 h-8 text-primary" />
              <span className="text-primary font-bold text-lg">Customer Love</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              What Our Users
              <span className="block text-primary">Are Saying</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Rocket className="w-8 h-8 text-primary" />
              <span className="text-primary font-bold text-lg">Simple Pricing</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Plans That Scale
              <span className="block text-primary">With You</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start free and upgrade as you grow. No hidden fees, no surprises.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <PricingCard key={index} {...plan} />
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-br from-primary via-accent to-secondary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/20 pointer-events-none"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-tertiary/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl lg:text-6xl font-bold mb-6">
            Ready to Transform
            <span className="block text-tertiary">Your Workflow?</span>
          </h2>
          
          <p className="text-xl lg:text-2xl text-white/90 mb-12 max-w-3xl mx-auto">
            Join thousands of teams who have already streamlined their processes 
            and boosted productivity with Benders Workflow.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {isAuthenticated ? (
              <button 
                onClick={() => navigate('/app/dashboard')}
                className="flex items-center gap-3 px-12 py-5 bg-tertiary hover:bg-tertiary/90 text-primary rounded-2xl font-bold text-xl transition-all duration-200 shadow-2xl hover:scale-105"
              >
                <Target className="w-7 h-7" />
                Go to Your Dashboard
                <ArrowRight className="w-6 h-6" />
              </button>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="flex items-center gap-3 px-12 py-5 bg-tertiary hover:bg-tertiary/90 text-primary rounded-2xl font-bold text-xl transition-all duration-200 shadow-2xl hover:scale-105"
              >
                <Rocket className="w-7 h-7" />
                Start Your Free Trial
                <ArrowRight className="w-6 h-6" />
              </button>
            )}
            
            <div className="text-white/80">
              <p className="font-semibold">14-day free trial • No credit card required</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Modal */}
      {showDemo && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Product Demo</h3>
                <button 
                  onClick={() => setShowDemo(false)}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
                >
                  ×
                </button>
              </div>
              
              <div className="aspect-video bg-gray-100 rounded-2xl flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Video className="w-20 h-20 mx-auto mb-6" />
                  <h4 className="text-xl font-semibold mb-2">Interactive Product Demo</h4>
                  <p className="text-gray-600 mb-6">See how Benders Workflow can transform your business processes</p>
                  <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold mx-auto hover:bg-primary/90 transition-colors duration-200">
                    <Play className="w-5 h-5" />
                    Play Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}