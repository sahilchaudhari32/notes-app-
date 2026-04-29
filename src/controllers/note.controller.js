import mongoose from "mongoose";
import Note from "../models/note.model.js";

const allowedCategories = ["work", "personal", "study"];
const allowedSortFields = ["title", "createdAt", "updatedAt", "category"];

const sendSuccess = (res, status, message, data, extra = {}) => {
  return res.status(status).json({
    success: true,
    message,
    ...extra,
    data,
  });
};

const sendError = (res, status, message) => {
  return res.status(status).json({
    success: false,
    message,
    data: null,
  });
};

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/* 1. Create single note */
export const createNote = async (req, res) => {
  try {
    const { title, content, category, isPinned } = req.body;

    if (!title || !content) {
      return sendError(res, 400, "Title and content are required");
    }

    const note = await Note.create({ title, content, category, isPinned });

    return sendSuccess(res, 201, "Note created successfully", note);
  } catch (error) {
    return sendError(res, 500, "Server error");
  }
};

/* 2. Create bulk notes */
export const createBulkNotes = async (req, res) => {
  try {
    const { notes } = req.body;

    if (!Array.isArray(notes) || notes.length === 0) {
      return sendError(res, 400, "notes array is required and cannot be empty");
    }

    const createdNotes = await Note.insertMany(notes);

    return sendSuccess(
      res,
      201,
      `${createdNotes.length} notes created successfully`,
      createdNotes
    );
  } catch (error) {
    return sendError(res, 500, "Server error");
  }
};

/* 3. Get all notes */
export const getAllNotes = async (req, res) => {
  try {
    const notes = await Note.find();

    return sendSuccess(res, 200, "Notes fetched successfully", notes, {
      count: notes.length,
    });
  } catch (error) {
    return sendError(res, 500, "Server error");
  }
};

/* 4. Get note by ID */
export const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return sendError(res, 400, "Invalid note ID");
    }

    const note = await Note.findById(id);

    if (!note) {
      return sendError(res, 404, "Note not found");
    }

    return sendSuccess(res, 200, "Note fetched successfully", note);
  } catch (error) {
    return sendError(res, 500, "Server error");
  }
};

/* 5. Replace note */
export const replaceNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!isValidId(id)) {
      return sendError(res, 400, "Invalid note ID");
    }

    if (!title || !content) {
      return sendError(res, 400, "Title and content are required");
    }

    const note = await Note.findOneAndReplace(
      { _id: id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!note) {
      return sendError(res, 404, "Note not found");
    }

    return sendSuccess(res, 200, "Note replaced successfully", note);
  } catch (error) {
    return sendError(res, 500, "Server error");
  }
};

/* 6. Partial update */
export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return sendError(res, 400, "Invalid note ID");
    }

    if (Object.keys(req.body).length === 0) {
      return sendError(res, 400, "No fields provided to update");
    }

    const note = await Note.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!note) {
      return sendError(res, 404, "Note not found");
    }

    return sendSuccess(res, 200, "Note updated successfully", note);
  } catch (error) {
    return sendError(res, 500, "Server error");
  }
};

/* 7. Delete single note */
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return sendError(res, 400, "Invalid note ID");
    }

    const note = await Note.findByIdAndDelete(id);

    if (!note) {
      return sendError(res, 404, "Note not found");
    }

    return sendSuccess(res, 200, "Note deleted successfully", null);
  } catch (error) {
    return sendError(res, 500, "Server error");
  }
};

/* 8. Delete bulk notes */
export const deleteBulkNotes = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return sendError(res, 400, "ids array is required and cannot be empty");
    }

    const invalidId = ids.some((id) => !isValidId(id));

    if (invalidId) {
      return sendError(res, 400, "One or more note ids are invalid");
    }

    const result = await Note.deleteMany({
      _id: { $in: ids },
    });

    return sendSuccess(
      res,
      200,
      `${result.deletedCount} notes deleted successfully`,
      null
    );
  } catch (error) {
    return sendError(res, 500, "Server error");
  }
};

/* 9. Get notes by category */
export const getNotesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (!allowedCategories.includes(category)) {
      return sendError(
        res,
        400,
        "Invalid category. Allowed: work, personal, study"
      );
    }

    const notes = await Note.find({ category });

    if (notes.length === 0) {
      return sendError(res, 404, `No notes found for category: ${category}`);
    }

    return sendSuccess(
      res,
      200,
      `Notes fetched for category: ${category}`,
      notes,
      { count: notes.length }
    );
  } catch (error) {
    return sendError(res, 500, "Server error");
  }
};

/* 10. Get notes by pinned status */
export const getNotesByStatus = async (req, res) => {
  try {
    const { isPinned } = req.params;

    if (isPinned !== "true" && isPinned !== "false") {
      return sendError(res, 400, "isPinned must be true or false");
    }

    const pinned = isPinned === "true";
    const notes = await Note.find({ isPinned: pinned });

    return sendSuccess(
      res,
      200,
      pinned ? "Fetched all pinned notes" : "Fetched all unpinned notes",
      notes,
      { count: notes.length }
    );
  } catch (error) {
    return sendError(res, 500, "Server error");
  }
};

/* 11. Get note summary */
export const getNoteSummary = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return sendError(res, 400, "Invalid note ID");
    }

    const note = await Note.findById(id).select(
      "title category isPinned createdAt"
    );

    if (!note) {
      return sendError(res, 404, "Note not found");
    }

    return sendSuccess(res, 200, "Note summary fetched successfully", note);
  } catch (error) {
    return sendError(res, 500, "Server error");
  }
};

/* 12. General filter */
export const filterNotes = async (req, res) => {
  try {
    const filter = {};

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.isPinned !== undefined) {
      if (req.query.isPinned !== "true" && req.query.isPinned !== "false") {
        return sendError(res, 400, "isPinned must be true or false");
      }

      filter.isPinned = req.query.isPinned === "true";
    }

    const notes = await Note.find(filter);

    return sendSuccess(res, 200, "Notes fetched successfully", notes, {
      count: notes.length,
    });
  } catch (error) {
    return sendError(res, 500, "Server error");
  }
};

/* 13. Get pinned notes */
export const getPinnedNotes = async (req, res) => {
  try {
    const filter = { isPinned: true };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    const notes = await Note.find(filter);

    return sendSuccess(res, 200, "Pinned notes fetched successfully", notes, {
      count: notes.length,
    });
  } catch (error) {
    return sendError(res, 500, "Server error");
  }
};

/* 14. Filter by category query */
export const filterByCategory = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return sendError(res, 400, "Query param 'name' is required");
    }

    if (!allowedCategories.includes(name)) {
      return sendError(
        res,
        400,
        "Invalid category. Allowed: work, personal, study"
      );
    }

    const notes = await Note.find({ category: name });

    return sendSuccess(
      res,
      200,
      `Notes filtered by category: ${name}`,
      notes,
      { count: notes.length }
    );
  } catch (error) {
    return sendError(res, 500, "Server error");
  }
};

/* 15. Filter by date range */
export const filterByDateRange = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return sendError(
        res,
        400,
        "Both 'from' and 'to' query params are required"
      );
    }

    const notes = await Note.find({
      createdAt: {
        $gte: new Date(from),
        $lte: new Date(to),
      },
    });

    return sendSuccess(
      res,
      200,
      `Notes fetched between ${from} and ${to}`,
      notes,
      { count: notes.length }
    );
  } catch (error) {
    return sendError(res, 500, "Server error");
  }
};

/* 16. Paginate notes */
export const paginateNotes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Note.countDocuments();
    const totalPages = Math.ceil(total / limit);

    const notes = await Note.find().skip(skip).limit(limit);

    return sendSuccess(res, 200, "Notes fetched successfully", notes, {
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    return sendError(res, 500, "Server error");
  }
};

/* 17. Paginate by category */
export const paginateByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (!allowedCategories.includes(category)) {
      return sendError(
        res,
        400,
        "Invalid category. Allowed: work, personal, study"
      );
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { category };

    const total = await Note.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const notes = await Note.find(filter).skip(skip).limit(limit);

    return sendSuccess(
      res,
      200,
      `Notes fetched for category: ${category}`,
      notes,
      {
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      }
    );
  } catch (error) {
    return sendError(res, 500, "Server error");
  }
};

/* 18. Sort all notes */
export const sortNotes = async (req, res) => {
  try {
    const sortBy = req.query.sortBy || "createdAt";
    const orderText = req.query.order || "desc";

    if (!allowedSortFields.includes(sortBy)) {
      return sendError(
        res,
        400,
        "Invalid sortBy. Allowed: title, createdAt, updatedAt, category"
      );
    }

    const order = orderText === "asc" ? 1 : -1;

    const notes = await Note.find().sort({ [sortBy]: order });

    return sendSuccess(
      res,
      200,
      `Notes sorted by ${sortBy} in ${
        order === 1 ? "ascending" : "descending"
      } order`,
      notes,
      { count: notes.length }
    );
  } catch (error) {
    return sendError(res, 500, "Server error");
  }
};

/* 19. Sort pinned notes */
export const sortPinnedNotes = async (req, res) => {
  try {
    const sortBy = req.query.sortBy || "createdAt";
    const orderText = req.query.order || "desc";

    if (!allowedSortFields.includes(sortBy)) {
      return sendError(
        res,
        400,
        "Invalid sortBy. Allowed: title, createdAt, updatedAt, category"
      );
    }

    const order = orderText === "asc" ? 1 : -1;

    const notes = await Note.find({ isPinned: true }).sort({
      [sortBy]: order,
    });

    return sendSuccess(
      res,
      200,
      `Pinned notes sorted by ${sortBy} in ${
        order === 1 ? "ascending" : "descending"
      } order`,
      notes,
      { count: notes.length }
    );
  } catch (error) {
    return sendError(res, 500, "Server error");
  }
};