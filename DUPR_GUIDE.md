# DUPR Integration Guide

## Overview
PaddleGrid now includes a complete DUPR (Dynamic Universal Pickleball Rating) system for tracking player skill levels and match results. This feature helps facilities run competitive leagues, track player progression, and maintain accurate skill ratings.

## Features

### For Players
- **Match Reporting**: Report match results after playing
- **Rating Tracking**: View your DUPR rating across singles and doubles
- **Match History**: See all your past matches and rating changes
- **Leaderboard**: Compare your rating with other players
- **Skill Levels**: Automatic categorization (Beginner, Intermediate, Advanced, Elite)

### For Administrators
- **Match Verification**: Review and approve reported matches before ratings update
- **Rating Management**: Monitor rating changes and adjust as needed
- **Match History**: View all facility matches with detailed statistics
- **Export Functionality**: Export match data to CSV for DUPR.com submission
- **Fraud Prevention**: Review matches before they affect ratings

## How It Works

### Rating System
DUPR uses an ELO-style rating system (0.00 - 8.00 scale):
- **0.00 - 2.99**: Beginner
- **3.00 - 3.99**: Intermediate
- **4.00 - 4.99**: Advanced
- **5.00+**: Elite

Rating changes are calculated based on:
- Your current rating
- Opponent's rating
- Match result (win/loss)
- Expected outcome probability

### Match Flow

#### 1. Reporting a Match
Players can report matches through:
- **Admin Panel**: Admin → DUPR Matches → "Report Match"
- **Quick Access**: Any logged-in player

Required information:
- Match date and time
- Facility and court
- Match type (Singles, Doubles, Mixed Doubles)
- Match format (Single Game, Best of 3, Best of 5)
- All players on both teams
- Final scores

#### 2. Verification Process
All matches start as "Pending" and require admin verification:

1. **Pending**: Match reported, awaiting verification
2. **Verified**: Admin reviewed and found legitimate
3. **Approved**: Ratings updated, match complete
4. **Rejected**: Match not legitimate, no rating change
5. **Submitted to DUPR**: Exported to official DUPR system

#### 3. Rating Updates
Once approved:
- Player ratings automatically update
- Rating history is recorded
- Match statistics are updated (total matches, wins, etc.)
- Leaderboard positions adjust

## Player Guide

### Reporting Your Match

1. Navigate to the "Report Match" button (visible in admin panel or main dashboard)
2. Fill in match details:
   - Select the date and time you played
   - Choose your facility and court
   - Select match type (singles/doubles/mixed)
   - Choose all 4 players (or 2 for singles)
   - Enter final scores
3. Click "Report Match"
4. Wait for admin verification (you'll see status as "Pending")

### Viewing Your Stats

**In Your Profile:**
- DUPR Rating (overall, singles, doubles)
- Total matches played
- Win/loss record
- Win percentage
- Rating history graph

**In Leaderboard:**
- Click "Leaderboard" in the navigation
- See your ranking among all players
- Filter by overall, singles, or doubles ratings
- View top performers and average ratings

### Match Status Meanings
- **Pending**: Waiting for admin review
- **Approved**: Match verified, rating updated
- **Rejected**: Match not counted (with admin notes)

## Administrator Guide

### Verifying Matches

1. Go to: Admin Panel → DUPR Matches
2. Review pending matches in the table
3. For each match:
   - Check players are correct
   - Verify scores are reasonable
   - Confirm date/time/location
4. Actions:
   - **Approve**: Click green checkmark (ratings update immediately)
   - **Reject**: Click red X, optionally add notes
   - **View Details**: Click eye icon for full information

### Best Practices for Verification

**Approve if:**
- All players confirm participation
- Scores are reasonable for skill levels
- Date/time/location are accurate
- No suspicious patterns

**Reject if:**
- Players dispute the match
- Scores seem fabricated
- Wrong players listed
- Duplicate match reports

### Managing Ratings

**Viewing Rating History:**
- Each player's profile shows rating progression
- Match details include rating changes for all participants
- Rating history tracks all changes with reasons

**Manual Adjustments:**
- Use the admin panel to adjust ratings if needed
- Add notes explaining adjustments
- Changes are logged in rating history

### Exporting Matches

To submit matches to DUPR.com:

1. Go to: Admin Panel → DUPR Matches
2. Apply filters if needed (date range, status, etc.)
3. Click "Export" button
4. CSV file downloads with all match data
5. Upload to DUPR.com portal

CSV includes:
- Date, time, match type
- All player names
- Scores and results
- Verification status

## Rating Calculation

### Algorithm
The system uses a modified ELO formula:

```
Rating Change = K-factor × (Actual Score - Expected Score)

Where:
- K-factor = 32 (standard for recreational play)
- Expected Score = 1 / (1 + 10^((Opponent Rating - Your Rating) / 400))
- Actual Score = 1.0 for win, 0.0 for loss
```

### Examples

**Example 1**: 3.5 player beats 3.5 player
- Expected: 50% chance to win
- Result: Win
- Rating change: +16 points (0.16)

**Example 2**: 3.0 player beats 4.0 player (upset)
- Expected: ~10% chance to win
- Result: Win
- Rating change: +29 points (0.29) - Large gain!

**Example 3**: 4.0 player beats 3.0 player (expected)
- Expected: ~90% chance to win
- Result: Win
- Rating change: +3 points (0.03) - Small gain

### Doubles Ratings
For doubles matches:
- Team rating = Average of both players' ratings
- Rating change distributed to both partners equally
- Separate doubles rating maintained

## Leaderboard

### Accessing
- Click "Leaderboard" in the main navigation (visible when logged in)
- Available to all authenticated users
- No special permissions required

### Features
- **Search**: Find specific players by name or email
- **Filter**: View overall, singles, or doubles ratings
- **Rankings**: Top 3 players highlighted with medals
- **Statistics**: Total players, average rating, highest rating
- **Win Rates**: See each player's win percentage

### Ranking System
- Players ranked by selected rating type
- Ties broken by total matches played
- New players start unranked until first match is approved

## Database Tables

For developers, DUPR uses these tables:

### `dupr_matches`
Stores all match records with facility, date, time, type, format, and verification status.

### `dupr_match_results`
Individual team/player results for each match, including scores and rating changes.

### `dupr_ratings_history`
Complete history of all rating changes for audit trail.

### `player_stats` (extended)
Added fields: `dupr_rating`, `dupr_singles_rating`, `dupr_doubles_rating`, `total_matches`, `matches_won`

## API / Integration

### Reporting Matches Programmatically
Matches can be reported via direct database insertion:

```sql
-- Insert match
INSERT INTO dupr_matches (facility_id, match_date, match_time, match_type, reported_by, status)
VALUES (...);

-- Insert results for both teams
INSERT INTO dupr_match_results (match_id, team_number, player1_id, player2_id, score, is_winner)
VALUES (...);
```

### Approval Function
Admins use the `approve_dupr_match` function:

```sql
SELECT approve_dupr_match(match_id, admin_user_id);
```

This automatically:
- Updates match status to 'approved'
- Calculates rating changes
- Updates player ratings
- Records rating history

## Troubleshooting

### Match Not Showing After Reporting
- Check match status (should be "Pending")
- Verify you're viewing the correct facility
- Ensure all required fields were filled

### Rating Not Updated
- Confirm match status is "Approved" (not just "Verified")
- Check rating history for the change record
- Verify admin actually approved (not just viewed)

### Wrong Rating After Match
- Contact admin to review match details
- Admin can reject and re-enter with correct information
- Manual rating adjustments can be made if needed

### Leaderboard Empty
- Players need at least one approved match to appear
- Check that matches have been approved, not just reported
- Verify RLS policies allow viewing player stats

## Future Enhancements

Potential additions:
- Integration with official DUPR.com API
- Automatic match scheduling based on ratings
- Tournament bracket generation
- Head-to-head statistics
- Rating predictions before matches
- Mobile app for quick match reporting
- QR code match reporting at courts

## Support

For issues or questions:
- Admins: Check the Admin Panel → DUPR Matches
- Players: Contact your facility administrator
- Technical: Review database logs and RLS policies
