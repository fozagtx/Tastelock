import { Badge, Box, Card, HStack, Heading, Stack, Table, Text } from "@chakra-ui/react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <HStack
      justify="space-between"
      align={{ base: "flex-start", md: "center" }}
      gap="4"
      flexWrap="wrap"
      marginBottom="8"
    >
      <Stack gap="1">
        <Heading size="lg" letterSpacing="tight">
          {title}
        </Heading>
        {description && (
          <Text fontSize="sm" color="fg.muted" maxWidth="640px">
            {description}
          </Text>
        )}
      </Stack>
      {action}
    </HStack>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  padded = true,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <Card.Root variant="outline" background="white" borderColor="border.muted" shadow="sm" overflow="hidden">
      {(title || action) && (
        <Card.Header borderBottomWidth="1px" borderColor="border.muted" paddingY="4">
          <HStack justify="space-between" gap="4" flexWrap="wrap">
            <Stack gap="0.5">
              {title && (
                <Heading size="sm" fontWeight="semibold">
                  {title}
                </Heading>
              )}
              {description && (
                <Text fontSize="xs" color="fg.muted">
                  {description}
                </Text>
              )}
            </Stack>
            {action}
          </HStack>
        </Card.Header>
      )}
      <Card.Body padding={padded ? "5" : "0"}>{children}</Card.Body>
    </Card.Root>
  );
}

export function StatCard({
  label,
  value,
  accent,
  emphasis = false,
}: {
  label: string;
  value: string;
  accent?: string;
  emphasis?: boolean;
}) {
  return (
    <Card.Root
      variant="outline"
      background="white"
      borderColor="border.muted"
      shadow="sm"
      borderLeftWidth="3px"
      borderLeftColor={accent ?? "transparent"}
    >
      <Card.Body gap="1" paddingY="4">
        <Text fontSize="xs" color="fg.muted" fontWeight="medium">
          {label}
        </Text>
        <Heading size="xl" fontWeight="semibold" color={emphasis ? accent : "fg"}>
          {value}
        </Heading>
      </Card.Body>
    </Card.Root>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Stack align="center" gap="2" paddingY="10" textAlign="center">
      <Box
        width="36px"
        height="36px"
        borderRadius="full"
        borderWidth="1px"
        borderColor="border.muted"
        background="bg.subtle"
        marginBottom="1"
      />
      <Text fontSize="sm" fontWeight="medium">
        {title}
      </Text>
      {description && (
        <Text fontSize="xs" color="fg.muted" maxWidth="380px">
          {description}
        </Text>
      )}
      {action && <Box marginTop="2">{action}</Box>}
    </Stack>
  );
}

export function StatusBadge({ tone, children }: { tone: "teal" | "orange" | "gray" | "red"; children: string }) {
  return (
    <Badge colorPalette={tone} variant="subtle" borderRadius="full" paddingX="2">
      {children}
    </Badge>
  );
}

export function Th({
  children,
  align = "start",
}: {
  children: React.ReactNode;
  align?: "start" | "end" | "center";
}) {
  return (
    <Table.ColumnHeader
      fontSize="xs"
      fontWeight="medium"
      color="fg.muted"
      textAlign={align}
      whiteSpace="nowrap"
    >
      {children}
    </Table.ColumnHeader>
  );
}

export function Td({
  children,
  align = "start",
  muted = false,
  wrap = false,
}: {
  children: React.ReactNode;
  align?: "start" | "end" | "center";
  muted?: boolean;
  wrap?: boolean;
}) {
  return (
    <Table.Cell
      paddingY="3"
      textAlign={align}
      color={muted ? "fg.muted" : undefined}
      whiteSpace={wrap ? "normal" : "nowrap"}
      maxWidth={wrap ? "320px" : undefined}
    >
      {children}
    </Table.Cell>
  );
}
