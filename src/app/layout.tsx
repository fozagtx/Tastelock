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
    <html lang="en">
      <body>
        <Provider>
          <Flex direction="column" minHeight="100vh">
            <Box as="header" borderBottomWidth="1px" borderColor="border.muted">
              <Flex
                align={{ base: "flex-start", md: "center" }}
                direction={{ base: "column", md: "row" }}
                justify="space-between"
                gap="1"
                maxWidth="1100px"
                margin="0 auto"
                width="100%"
                paddingX={{ base: "4", md: "8" }}
                paddingY="4"
              >
                <Heading size="md" letterSpacing="tight">
                  TasteLock
                </Heading>
                <Text fontSize="sm" color="fg.muted">
                  an MCP server for agents that learn from your corrections
                </Text>
              </Flex>
            </Box>

            <Box as="main" flex="1" paddingX={{ base: "4", md: "8" }} paddingY={{ base: "6", md: "10" }}>
              <Box maxWidth="1100px" margin="0 auto">
                {children}
              </Box>
            </Box>

            <Box as="footer" borderTopWidth="1px" borderColor="border.muted">
              <Flex
                direction={{ base: "column", md: "row" }}
                gap="2"
                maxWidth="1100px"
                margin="0 auto"
                width="100%"
                paddingX={{ base: "4", md: "8" }}
                paddingY="6"
                justify="space-between"
              >
                <Text fontSize="xs" color="fg.muted">
                  Rules live in HydraDB as graph nodes. Nothing activates without human validation.
                </Text>
                <Link fontSize="xs" color="fg.muted" href="/api/health">
                  /api/health
                </Link>
              </Flex>
            </Box>
          </Flex>
        </Provider>
      </body>
    </html>
  );
}
