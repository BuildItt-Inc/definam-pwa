import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>DefinAm PWA</h1>
      <p>Repository scaffold is ready for implementation.</p>
      <ul>
        <li>
          <Link href="/login">Admin login</Link>
        </li>
        <li>
          <Link href="/activate">Student activation</Link>
        </li>
        <li>
          <Link href="/student">Student dashboard</Link>
        </li>
        <li>
          <Link href="/admin">Admin dashboard</Link>
        </li>
      </ul>
    </main>
  );
}
