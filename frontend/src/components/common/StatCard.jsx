import { Card, CardContent, Typography, Box } from '@mui/material';

/**
 * Reusable dashboard stat card.
 * Props: title, value, icon?, color?
 */
export default function StatCard({ title, value, icon, color = 'primary.main' }) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">{title}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color }}>{value}</Typography>
          </Box>
          {icon && (
            <Box sx={{ color, opacity: 0.7, fontSize: 40 }}>{icon}</Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
