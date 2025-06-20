const express = require('express');
const { body, validationResult } = require('express-validator');
const Meeting = require('../models/Meeting');
const router = express.Router();

// Validation middleware
const validateMeeting = [
  body('clientId').notEmpty().withMessage('Client ID is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('meetingDate').isISO8601().withMessage('Valid meeting date is required'),
  body('description').optional().trim(),
  body('durationMinutes').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('location').optional().trim(),
  body('meetingType').optional().isIn(['in-person', 'video', 'phone']),
];

// GET /api/meetings - Get all meetings
router.get('/', async (req, res) => {
  try {
    const { clientId, upcoming, startDate, endDate } = req.query;
    
    let meetings;
    if (upcoming) {
      const days = parseInt(upcoming) || 7;
      meetings = await Meeting.findUpcoming(days);
    } else if (startDate && endDate) {
      meetings = await Meeting.findByDateRange(new Date(startDate), new Date(endDate));
    } else if (clientId) {
      meetings = await Meeting.findByClientId(clientId);
    } else {
      meetings = await Meeting.findAll();
    }
    
    res.json(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// GET /api/meetings/:id - Get meeting by ID
router.get('/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    res.json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ error: 'Failed to fetch meeting' });
  }
});

// GET /api/meetings/:id/attendees - Get meeting attendees
router.get('/:id/attendees', async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    const attendees = await meeting.getAttendees();
    res.json(attendees);
  } catch (error) {
    console.error('Error fetching meeting attendees:', error);
    res.status(500).json({ error: 'Failed to fetch meeting attendees' });
  }
});

// POST /api/meetings - Create new meeting
router.post('/', validateMeeting, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const meeting = new Meeting({
      clientId: req.body.clientId,
      title: req.body.title,
      description: req.body.description,
      meetingDate: new Date(req.body.meetingDate),
      durationMinutes: req.body.durationMinutes || 60,
      location: req.body.location,
      meetingType: req.body.meetingType || 'in-person',
      status: req.body.status || 'scheduled',
      notes: req.body.notes
    });

    await meeting.save(req.body.performedBy);
    
    // Add attendees if provided
    if (req.body.attendees && Array.isArray(req.body.attendees)) {
      for (const memberId of req.body.attendees) {
        await meeting.addAttendee(memberId);
      }
    }
    
    res.status(201).json(meeting);
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// POST /api/meetings/:id/attendees - Add attendee to meeting
router.post('/:id/attendees', async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const { memberId, attendanceStatus } = req.body;
    if (!memberId) {
      return res.status(400).json({ error: 'Member ID is required' });
    }

    const attendeeId = await meeting.addAttendee(memberId, attendanceStatus);
    res.status(201).json({ id: attendeeId, memberId, attendanceStatus: attendanceStatus || 'invited' });
  } catch (error) {
    console.error('Error adding meeting attendee:', error);
    res.status(500).json({ error: 'Failed to add meeting attendee' });
  }
});

// PUT /api/meetings/:id - Update meeting
router.put('/:id', validateMeeting, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    meeting.clientId = req.body.clientId;
    meeting.title = req.body.title;
    meeting.description = req.body.description;
    meeting.meetingDate = new Date(req.body.meetingDate);
    meeting.durationMinutes = req.body.durationMinutes || meeting.durationMinutes;
    meeting.location = req.body.location;
    meeting.meetingType = req.body.meetingType || meeting.meetingType;
    meeting.status = req.body.status || meeting.status;
    meeting.notes = req.body.notes;

    await meeting.save(req.body.performedBy);
    res.json(meeting);
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

// PATCH /api/meetings/:id/status - Update meeting status
router.patch('/:id/status', async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const { status } = req.body;
    if (!['scheduled', 'completed', 'cancelled', 'rescheduled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    meeting.status = status;
    await meeting.save(req.body.performedBy);
    res.json(meeting);
  } catch (error) {
    console.error('Error updating meeting status:', error);
    res.status(500).json({ error: 'Failed to update meeting status' });
  }
});

// PATCH /api/meetings/:id/attendees/:memberId - Update attendee status
router.patch('/:id/attendees/:memberId', async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const { attendanceStatus } = req.body;
    if (!['invited', 'accepted', 'declined', 'attended', 'no-show'].includes(attendanceStatus)) {
      return res.status(400).json({ error: 'Invalid attendance status' });
    }

    await meeting.updateAttendeeStatus(req.params.memberId, attendanceStatus);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating attendee status:', error);
    res.status(500).json({ error: 'Failed to update attendee status' });
  }
});

// DELETE /api/meetings/:id - Delete meeting
router.delete('/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    await meeting.delete(req.body.performedBy);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

// DELETE /api/meetings/:id/attendees/:memberId - Remove attendee from meeting
router.delete('/:id/attendees/:memberId', async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    await meeting.removeAttendee(req.params.memberId);
    res.status(204).send();
  } catch (error) {
    console.error('Error removing meeting attendee:', error);
    res.status(500).json({ error: 'Failed to remove meeting attendee' });
  }
});

module.exports = router; 