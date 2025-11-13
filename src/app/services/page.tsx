import Image from "next/image";
import Link from "next/link";
import type { SimpleIcon } from "simple-icons";
import {
  siApple,
  siRakutenkobo,
  siScribd,
} from "simple-icons/icons";
import {
  Palette,
  Layout,
  Globe,
  Rocket,
  Smartphone,
  MessageCircle,
  FileText,
  CheckCircle,
  Package,
  Upload,
  Settings,
  Download,
  BookOpen,
  Sparkles,
  Eye,
  RefreshCw,
  Star,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

export const metadata = {
  title: "Publishing Services · IndieConverters",
  description:
    "Launch your book with cover design, illustration, typesetting, translation, and digital distribution support.",
};

const partnerLogos: SimpleIcon[] = [
  siRakutenkobo,
  siApple,
  siScribd,
];

async function fetchInHouseBooks() {
  const supabase = createServerSupabaseClient();
  
  const { data: publisher } = await supabase
    .from('publishers')
    .select('id')
    .eq('slug', 'indieconverters')
    .single();

  if (!publisher) return [];

  const { data: books } = await supabase
    .from('books')
    .select(`
      id,
      slug,
      title,
      cover_url,
      rating,
      books_authors (
        authors:author_id (
          display_name,
          slug
        )
      ),
      books_genres (
        genres:genre_id (
          label
        )
      )
    `)
    .eq('publisher_id', publisher.id)
    .eq('is_published', true)
    .not('rating', 'is', null)
    .order('rating', { ascending: false })
    .limit(8);

  return books || [];
}

export default async function ServicesPage() {
  const inHouseBooks = await fetchInHouseBooks();

  return (
    <main className="min-h-screen bg-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/assets/services-hero-image.png"
            alt="Author reading outdoors with their dog"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-[#34146d]/90 to-[#4b1e9d]/90" />
        </div>

        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-20 text-center text-white lg:py-28">
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Publish at scale with IndieConverters.
          </h1>
          <p className="text-lg text-white/80">
            Distribute worldwide. Join the IndieConverters Collective and get your work into readers’ hands without borders.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
            <Link
              href="/services/start"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-orange-400 px-10 py-4 text-lg font-semibold text-white shadow-xl transition hover:scale-[1.02] hover:shadow-2xl"
            >
              Publish for free
            </Link>
          
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-white/80">
            {["Cover & Illustration", "Editorial Design", "Global Distribution", "Marketing Kits"].map(
              (item) => (
              <span
                key={item}
                className="rounded-full border border-white/30 px-4 py-1"
              >
                {item}
              </span>
              )
            )}
          </div>

        </div>
      </section>

      {/* Services Offerings Section */}
      <section className="bg-gradient-to-b from-zinc-50 to-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-zinc-900">
              Everything You Need to Publish Successfully
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600">
              From manuscript to worldwide distribution, we provide comprehensive publishing services tailored for independent authors.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Service 1: Cover Design */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition hover:shadow-2xl">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <Palette className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-zinc-900">
                Cover & Illustration Design
              </h3>
              <p className="mb-4 text-zinc-600">
                Professional cover designs that capture attention and reflect your story's essence. Custom illustrations available.
              </p>
              <ul className="space-y-2 text-sm text-zinc-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Custom cover artwork</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Multiple format optimization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Unlimited revisions</span>
                </li>
              </ul>
              <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-purple-100 opacity-20 transition group-hover:scale-150" />
            </div>

            {/* Service 2: Editorial Design */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition hover:shadow-2xl">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                <Layout className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-zinc-900">
                Editorial & Typesetting
              </h3>
              <p className="mb-4 text-zinc-600">
                Professional layout and typesetting services ensuring your book looks polished and professional inside and out.
              </p>
              <ul className="space-y-2 text-sm text-zinc-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Professional interior layout</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Typography optimization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Print & eBook formatting</span>
                </li>
              </ul>
              <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-blue-100 opacity-20 transition group-hover:scale-150" />
            </div>

            {/* Service 3: Translation */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition hover:shadow-2xl">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                <Globe className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-zinc-900">
                Translation Services
              </h3>
              <p className="mb-4 text-zinc-600">
                Reach global audiences with professional translations in Spanish, Portuguese, and other languages.
              </p>
              <ul className="space-y-2 text-sm text-zinc-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Native speaker translators</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Cultural adaptation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Quality assurance review</span>
                </li>
              </ul>
              <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-green-100 opacity-20 transition group-hover:scale-150" />
            </div>

            {/* Service 4: Global Distribution */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition hover:shadow-2xl">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
                <Rocket className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-zinc-900">
                Global Distribution
              </h3>
              <p className="mb-4 text-zinc-600">
                Get your book into major retailers and digital platforms across Europe, Latin America, and beyond.
              </p>
              <ul className="space-y-2 text-sm text-zinc-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Amazon, Apple Books, Kobo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Print-on-demand networks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Independent bookstores</span>
                </li>
              </ul>
              <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-orange-100 opacity-20 transition group-hover:scale-150" />
            </div>

            {/* Service 5: Marketing Kits */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition hover:shadow-2xl">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white">
                <Smartphone className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-zinc-900">
                Marketing Materials
              </h3>
              <p className="mb-4 text-zinc-600">
                Complete marketing kits including social media graphics, promotional materials, and launch strategies.
              </p>
              <ul className="space-y-2 text-sm text-zinc-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Social media templates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Promotional graphics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Launch campaign support</span>
                </li>
              </ul>
              <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-pink-100 opacity-20 transition group-hover:scale-150" />
            </div>

            {/* Service 6: Author Support */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition hover:shadow-2xl">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                <MessageCircle className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-zinc-900">
                Dedicated Support
              </h3>
              <p className="mb-4 text-zinc-600">
                Personal guidance throughout your publishing journey with responsive support and expert advice.
              </p>
              <ul className="space-y-2 text-sm text-zinc-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Publishing consultation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Sales reporting & analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Ongoing technical support</span>
                </li>
              </ul>
              <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-indigo-100 opacity-20 transition group-hover:scale-150" />
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action - Full Width */}
      <section className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 py-12 text-center text-white">
        <h3 className="mb-3 text-3xl font-bold">
          Ready to Start Your Publishing Journey?
        </h3>
        <p className="mb-6 text-lg text-white/90">
          Join thousands of independent authors who trust IndieConverters with their publishing needs.
        </p>
        <Link
          href="/services/start"
          className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-lg font-semibold text-purple-700 shadow-lg transition hover:scale-105 hover:bg-purple-50"
        >
          Get Started Free
        </Link>
      </section>

      {/* ISBN Registration Section */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-zinc-900">
              ISBN Registration Made Simple
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600">
              Get your book professionally registered with a unique ISBN in three easy steps
            </p>
          </div>

          {/* Steps Infographic */}
          <div className="relative">
            {/* Connection Line - Desktop Only */}
            <div className="absolute top-20 left-1/2 hidden h-1 w-2/3 -translate-x-1/2 bg-gradient-to-r from-purple-200 via-purple-300 to-pink-200 lg:block" />

            <div className="grid gap-12 md:grid-cols-3">
              {/* Step 1 */}
              <div className="relative flex flex-col items-center text-center">
                {/* Icon Circle */}
                <div className="relative z-10 mb-6 flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 shadow-xl">
                  <FileText className="h-20 w-20 text-white" strokeWidth={1.5} />
                </div>
                {/* Step Number */}
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-lg font-bold text-white shadow-lg">
                  1
                </div>
                {/* Content */}
                <h3 className="mb-3 text-2xl font-bold text-zinc-900">
                  Submit Your Details
                </h3>
                <p className="text-zinc-600">
                  Provide your book's title, author name, format, and publication details through our simple online form.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative flex flex-col items-center text-center">
                {/* Icon Circle */}
                <div className="relative z-10 mb-6 flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-500 shadow-xl">
                  <CheckCircle className="h-20 w-20 text-white" strokeWidth={1.5} />
                </div>
                {/* Step Number */}
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-pink-600 text-lg font-bold text-white shadow-lg">
                  2
                </div>
                {/* Content */}
                <h3 className="mb-3 text-2xl font-bold text-zinc-900">
                  We Process & Register
                </h3>
                <p className="text-zinc-600">
                  Our team handles the registration with the official ISBN agency, ensuring accuracy and compliance with international standards.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative flex flex-col items-center text-center">
                {/* Icon Circle */}
                <div className="relative z-10 mb-6 flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-pink-600 shadow-xl">
                  <Package className="h-20 w-20 text-white" strokeWidth={1.5} />
                </div>
                {/* Step Number */}
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-pink-600 text-lg font-bold text-white shadow-lg">
                  3
                </div>
                {/* Content */}
                <h3 className="mb-3 text-2xl font-bold text-zinc-900">
                  Receive Your ISBN
                </h3>
                <p className="text-zinc-600">
                  Get your unique ISBN with barcode graphics ready for print and digital distribution worldwide.
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info Box */}
          <div className="mt-16 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 p-8">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold text-purple-600">24-48h</div>
                <div className="text-sm text-zinc-600">Processing Time</div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold text-purple-600">$25</div>
                <div className="text-sm text-zinc-600">Per ISBN</div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold text-purple-600">100%</div>
                <div className="text-sm text-zinc-600">Ownership Retained</div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold text-purple-600">Global</div>
                <div className="text-sm text-zinc-600">Recognition</div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-12 text-center">
            <Link
              href="/services/isbn"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
            >
              Register Your ISBN Now
            </Link>
          </div>
        </div>
      </section>

      {/* EPUB Conversion Section */}
      <section className="bg-gradient-to-b from-zinc-50 to-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-blue-100 px-4 py-2">
              <BookOpen className="mr-2 h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-600">EPUB CONVERSION</span>
            </div>
            <h2 className="mb-4 text-4xl font-bold text-zinc-900">
              Professional eBook Formatting
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600">
              Convert your manuscript to industry-standard EPUB format, optimized for all major e-readers and platforms
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center mb-16">
            {/* Left: Features List */}
            <div>
              <h3 className="mb-6 text-2xl font-bold text-zinc-900">
                What's Included in Our EPUB Conversion
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-zinc-900">EPUB 2 & 3 Formats</h4>
                    <p className="text-sm text-zinc-600">Compatible with all major e-readers including Kindle, Apple Books, Kobo, and more</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-zinc-900">Responsive Typography</h4>
                    <p className="text-sm text-zinc-600">Text adapts beautifully to any screen size with proper font scaling and spacing</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-zinc-900">Interactive Table of Contents</h4>
                    <p className="text-sm text-zinc-600">Clickable navigation for easy chapter jumping and enhanced reading experience</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-zinc-900">Image Optimization</h4>
                    <p className="text-sm text-zinc-600">Photos, illustrations, and graphics properly embedded and optimized for fast loading</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-zinc-900">Metadata & DRM Support</h4>
                    <p className="text-sm text-zinc-600">Complete metadata setup and optional DRM protection for your content</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Process Steps */}
            <div>
              <div className="rounded-2xl bg-white p-8 shadow-xl">
                <h3 className="mb-8 text-2xl font-bold text-zinc-900">
                  Simple Conversion Process
                </h3>
                
                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div className="flex-1 pt-2">
                      <h4 className="mb-1 font-semibold text-zinc-900">Upload Your File</h4>
                      <p className="text-sm text-zinc-600">Send us your manuscript in Word, PDF, or InDesign format</p>
                    </div>
                  </div>

                  {/* Connector */}
                  <div className="ml-6 h-8 w-0.5 bg-gradient-to-b from-blue-200 to-cyan-200"></div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg">
                      <Settings className="h-6 w-6" />
                    </div>
                    <div className="flex-1 pt-2">
                      <h4 className="mb-1 font-semibold text-zinc-900">We Format & Optimize</h4>
                      <p className="text-sm text-zinc-600">Our experts convert and test across multiple devices</p>
                    </div>
                  </div>

                  {/* Connector */}
                  <div className="ml-6 h-8 w-0.5 bg-gradient-to-b from-cyan-200 to-teal-200"></div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg">
                      <Download className="h-6 w-6" />
                    </div>
                    <div className="flex-1 pt-2">
                      <h4 className="mb-1 font-semibold text-zinc-900">Download Your EPUB</h4>
                      <p className="text-sm text-zinc-600">Receive publication-ready files in 3-5 business days</p>
                    </div>
                  </div>
                </div>

                {/* Pricing Box */}
                <div className="mt-8 rounded-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 text-center">
                  <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
                    Starting From
                  </div>
                  <div className="mb-1 text-4xl font-bold text-zinc-900">
                    $49
                  </div>
                  <div className="text-sm text-zinc-600">
                    Per manuscript • Includes revisions
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-12 text-center">
            <Link
              href="/services/epub"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
            >
              Start Your EPUB Conversion
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#4b1e9d]">
              Our Partners
            </p>
         
            <p className="text-sm text-zinc-500 max-w-2xl">
              Trusted retailers and digital shelves that bring Indie converters books to readers everywhere.
            </p>
          </div>
          <div className="mt-10 overflow-hidden">
            <div className="flex animate-marquee gap-8">
              {[...partnerLogos, ...partnerLogos].map((partner, index) => (
                <div
                  key={`${partner.title}-${index}`}
                  className="flex h-24 w-48 flex-shrink-0 items-center justify-center rounded-2xl bg-transparent shadow-none"
                >
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    aria-label={partner.title}
                    className="h-16 w-auto"
                    fill={`#${partner.hex}`}
                  >
                    <title>{partner.title}</title>
                    <path d={partner.path} />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cover Design Service Section */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-zinc-900">
              Book Covers That Sell
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600">
              Your cover is the first thing readers see. Our professional designers create stunning covers that capture attention and drive sales.
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center mb-16">
            {/* Left: Visual Feature Card */}
            <div className="relative">
              <div className="rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 p-12 text-white shadow-2xl">
                <h3 className="mb-6 text-3xl font-bold">
                  Professional Design Process
                </h3>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="mb-2 font-semibold">Custom Concepts</h4>
                      <p className="text-sm text-white/90">
                        Original designs tailored to your genre, story, and target audience
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="mb-2 font-semibold">Market Research</h4>
                      <p className="text-sm text-white/90">
                        Analysis of bestselling covers in your genre for maximum appeal
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                      <RefreshCw className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="mb-2 font-semibold">Unlimited Revisions</h4>
                      <p className="text-sm text-white/90">
                        We refine until you're completely satisfied with the result
                      </p>
                    </div>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-pink-300/20 blur-3xl" />
              </div>
            </div>

            {/* Right: Try For Free Package */}
            <div>
              <div className="rounded-2xl border-2 border-purple-600 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 p-10 shadow-2xl">
                <div className="mb-6 inline-flex items-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-bold text-white shadow-lg">
                  ✨ LIMITED TIME OFFER
                </div>
                
                <h3 className="mb-4 text-3xl font-bold text-zinc-900">
                  Start Your Cover Design Journey
                </h3>
                
                <p className="mb-8 text-lg text-zinc-600">
                  Get a <span className="font-bold text-purple-600">free consultation</span> with our design team and see custom mockups for your book before committing.
                </p>

                <div className="mb-8 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-900">Free Design Consultation</h4>
                      <p className="text-sm text-zinc-600">30-minute strategy call to discuss your vision and genre requirements</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-900">Custom Concept Preview</h4>
                      <p className="text-sm text-zinc-600">See initial design mockups tailored to your book's unique story</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-900">Market Analysis Report</h4>
                      <p className="text-sm text-zinc-600">Insights on what's working in your genre's bestselling covers</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-900">Zero Commitment</h4>
                      <p className="text-sm text-zinc-600">No payment required to start. Only proceed if you love what you see</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100 p-4 text-center">
                  <p className="text-sm font-semibold text-purple-900">
                    🎁 <span className="font-bold">Bonus:</span> Book your consultation this week and receive a complimentary social media cover template pack ($49 value)
                  </p>
                </div>

                <Link
                  href="/services/cover-consultation"
                  className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:scale-105 hover:shadow-2xl"
                >
                  Get Your Free Consultation
                </Link>

                <p className="mt-4 text-center text-xs text-zinc-500">
                  ⚡ 47 authors started their consultation this week
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <Link
              href="/services/cover-design"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
            >
              Get Your Custom Cover Design
            </Link>
          </div>
        </div>
      </section>

      {/* In-House Published Books Section */}
      <section className="bg-gradient-to-b from-zinc-50 to-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* Section Header */}
          <div className="mb-12 text-center">
            <h4 className="text-lg text-zinc-600">
              Discover books published through IndieConverters that are captivating readers worldwide
            </h4>
          </div>

          {inHouseBooks.length > 0 ? (
            <>
              {/* Books Grid */}
              <div className="mb-12 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
                {inHouseBooks.map((book: any) => {
                  const author = book.books_authors?.[0]?.authors;
                  const genre = book.books_genres?.[0]?.genres;
                  
                  return (
                    <Link
                      key={book.id}
                      href={`/catalog/${book.slug}`}
                      className="group"
                    >
                      <div className="relative mb-4 aspect-[2/3] overflow-hidden rounded-xl bg-white shadow-lg transition group-hover:scale-105 group-hover:shadow-2xl">
                        {/* Rating Badge */}
                        {book.rating && (
                          <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                            <Star className="h-3 w-3 fill-white" />
                            <span>{book.rating.toFixed(1)}</span>
                          </div>
                        )}
                        
                        <Image
                          src={book.cover_url || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80'}
                          alt={book.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        />
                      </div>
                      
                      <h3 className="mb-1 font-semibold text-zinc-900 line-clamp-2 group-hover:text-purple-600 transition">
                        {book.title}
                      </h3>
                      
                      {author && (
                        <p className="mb-1 text-sm text-zinc-600">
                          by {author.display_name}
                        </p>
                      )}
                      
                      {genre && (
                        <p className="text-xs text-zinc-500">
                          {genre.label}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="mt-12 text-center">
                <p className="mb-4 text-lg font-semibold text-zinc-900">
                  Ready to join our community of successful authors?
                </p>
                <Link
                  href="/services/start"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
                >
                  Start Your Publishing Journey
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-zinc-500">
                Our published books collection is coming soon. Check back shortly!
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

