"use client";

import { Box, Flex, HStack, Heading, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/corrections", label: "Corrections" },
  { href: "/rules", label: "Rules" },
  { href: "/export", label: "Export" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <Flex direction={{ base: "column", md: "row" }} minHeight="100vh">
      <Box
        as="aside"
        width={{ base: "full", md: "220px" }}
        flexShrink="0"
        borderRightWidth={{ base: "0", md: "1px" }}
        borderBottomWidth={{ base: "1px", md: "0" }}
        borderColor="border.muted"
        paddingX={{ base: "4", md: "5" }}
        paddingY="5"
      >
        <Stack gap="1">
          <Heading size="md" letterSpacing="tight">
            TasteLock
          </Heading>
          <Text fontSize="xs" color="fg.muted">
            corrections become rules
          </Text>
        </Stack>

        <HStack gap="1" marginTop="5" flexWrap="wrap">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                asChild
                paddingX="3"
                paddingY="1.5"
                borderRadius="md"
                fontSize="sm"
                background={active ? "bg.subtle" : "transparent"}
                color={active ? "fg" : "fg.muted"}
                fontWeight={active ? "semibold" : "normal"}
                _hover={{ background: "bg.subtle", textDecoration: "none" }}
              >
                <NextLink href={item.href}>{item.label}</NextLink>
              </Link>
            );
          })}
        </HStack>
      </Box>

      <Box flex="1" minWidth="0" paddingX={{ base: "4", md: "8" }} paddingY="8">
        <Box maxWidth="1000px">{children}</Box>
      </Box>
    </Flex>
  );
}
