"use client";

import { Box, Flex, HStack, Heading, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview", hint: "counts and review" },
  { href: "/corrections", label: "Corrections", hint: "what agents got wrong" },
  { href: "/rules", label: "Rules", hint: "validate or retire" },
  { href: "/export", label: "Export", hint: "bundle for other agents" },
  { href: "/connect", label: "Connect", hint: "MCP and integrations" },
];

function Mark() {
  return (
    <Box color="teal.solid" flexShrink="0" lineHeight="0">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        <circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    </Box>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <Flex direction={{ base: "column", md: "row" }} minHeight="100vh">
      <Box
        as="aside"
        width={{ base: "full", md: "236px" }}
        flexShrink="0"
        borderRightWidth={{ base: "0", md: "1px" }}
        borderBottomWidth={{ base: "1px", md: "0" }}
        borderColor="border.muted"
        paddingX={{ base: "4", md: "5" }}
        paddingY="5"
      >
        <HStack gap="2" align="center">
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
                background={active ? "bg.subtle" : "transparent"}
                color={active ? "fg" : "fg.muted"}
                _hover={{ background: "bg.subtle", textDecoration: "none" }}
              >
                <NextLink href={item.href}>
                  <Stack gap="0">
                    <Text fontSize="sm" fontWeight={active ? "semibold" : "medium"}>
                      {item.label}
                    </Text>
                    <Text fontSize="xs" color="fg.subtle">
                      {item.hint}
                    </Text>
                  </Stack>
                </NextLink>
              </Link>
            );
          })}
        </Stack>
      </Box>

      <Box flex="1" minWidth="0" paddingX={{ base: "4", md: "8" }} paddingY="8">
        <Box maxWidth="1000px">{children}</Box>
      </Box>
    </Flex>
  );
}
