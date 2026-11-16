import type { Metadata } from "next";
import { Box, Flex, Heading, Link, Text } from "@chakra-ui/react";
import { Provider } from "./provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "TasteLock",
  description: "Corrections become rules your agents follow — stored in HydraDB, served over MCP.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Provider>
          <Flex direction="column" minHeight="100vh">
            <Box as="header" borderBottomWidth="1px" borderColor="whiteAlpha.200" paddingX="8" paddingY="4">
              <Flex align="center" justify="space-between" maxWidth="1100px" margin="0 auto" width="100%">
                <Heading size="md" letterSpacing="tight">
                  TasteLock
                </Heading>
                <Text fontSize="sm" color="whiteAlpha.600">
                  an MCP server for agents that learn from your corrections
                </Text>
              </Flex>
            </Box>
            <Box as="main" flex="1" paddingX="8" paddingY="10">
              <Box maxWidth="1100px" margin="0 auto">
                {children}
              </Box>
            </Box>
            <Box as="footer" borderTopWidth="1px" borderColor="whiteAlpha.200" paddingX="8" paddingY="6">
              <Flex maxWidth="1100px" margin="0 auto" width="100%" justify="space-between">
                <Text fontSize="xs" color="whiteAlpha.500">
                  Rules live in HydraDB as graph nodes. Nothing activates without human validation.
                </Text>
                <Link asChild fontSize="xs" color="whiteAlpha.500">
                  <a href="/api/health">/api/health</a>
                </Link>
              </Flex>
            </Box>
          </Flex>
        </Provider>
      </body>
    </html>
  );
}
