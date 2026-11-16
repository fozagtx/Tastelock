"use client";

import { Box, Flex, HStack, Heading, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/corrections", label: "Corrections" },
  { href: "/rules", label: "Rules" },
  { href: "/export", label: "Export" },
  { href: "/connect", label: "Connect" },
];

function Mark() {
  return (
    <Flex
      width="30px"
      height="30px"
      borderRadius="lg"
      background="teal.solid"
      color="white"
      align="center"
      justify="center"
      flexShrink="0"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    </Flex>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <Flex direction={{ base: "column", md: "row" }} minHeight="100vh">
      <Box
        as="aside"
        width={{ base: "full", md: "232px" }}
        flexShrink="0"
        background="white"
        borderRightWidth={{ base: "0", md: "1px" }}
        borderBottomWidth={{ base: "1px", md: "0" }}
        borderColor="border.muted"
        paddingX="4"
        paddingY="5"
        position={{ base: "static", md: "sticky" }}
        top="0"
        height={{ base: "auto", md: "100vh" }}
      >
        <HStack gap="2.5" align="center" paddingX="2">
          <Mark />
          <Stack gap="0">
            <Heading size="sm" letterSpacing="tight">
              TasteLock
            </Heading>
            <Text fontSize="xs" color="fg.muted">
              corrections become rules
            </Text>
          </Stack>
        </HStack>

        <Stack
          as="nav"
          gap="0.5"
          marginTop="6"
          direction={{ base: "row", md: "column" }}
          flexWrap={{ base: "wrap", md: "nowrap" }}
        >
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                asChild
                paddingX="3"
                paddingY="2"
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
        </Stack>
      </Box>

      <Box flex="1" minWidth="0" paddingX={{ base: "4", md: "10" }} paddingY={{ base: "6", md: "9" }}>
        <Box maxWidth="1040px" margin="0 auto">
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
