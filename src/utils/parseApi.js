/** Normalize API body: supports { success, data, ...legacyFields } */
export function parseApiBody(body) {
  if (!body || typeof body !== "object") {
    return { success: false, message: "Invalid response", data: {} };
  }

  if (body.success === false) {
    const err = new Error(body.message || "Request failed");
    err.api = body;
    throw err;
  }

  const nested = body.data;
  if (nested != null && typeof nested === "object" && !Array.isArray(nested)) {
    return {
      success: body.success !== false,
      message: body.message || "",
      ...nested,
      data: nested,
    };
  }

  return {
    success: body.success !== false,
    message: body.message || "",
    ...body,
    data: body,
  };
}

export function pickPlan(parsed) {
  return parsed.plan || parsed.data?.plan || null;
}

export function pickSession(parsed) {
  return parsed.session || parsed.data?.session || null;
}
