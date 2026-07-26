import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function getOrCreateDbUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    return null;
  }


  const user = await db.user.upsert({
    where: { id: clerkUser.id },
    update: {
      email,
      name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || email,
      imageUrl: clerkUser.imageUrl,
    },
    create: {
      id: clerkUser.id,
      email,
      name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || email,
      imageUrl: clerkUser.imageUrl,
    },
  });

  return user;
}