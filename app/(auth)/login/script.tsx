import { prisma } from "@/lib/prisma";

async function main() {
  // Create a new user
  const user = await prisma.user.create({
    data: {
      fullName: "Maximus",
      email: "maximus@gmail.com",
      password: "123456", // In a real app, hash this password first!
    },
  });

  console.log("Created user:", user);

  // Fetch all users
  const allUsers = await prisma.user.findMany();

  console.log("All users:");
  console.log(JSON.stringify(allUsers, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });