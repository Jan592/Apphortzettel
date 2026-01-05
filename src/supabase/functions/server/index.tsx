import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Override console.error to suppress "Http: connection closed" errors
// These occur frequently in mobile/PWA environments when clients disconnect
// and should not be treated as critical server errors.
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Check if any argument is an Error object matching the pattern
  const hasConnectionClosedError = args.some((arg: any) => 
    arg instanceof Error && (
      arg.name === 'Http' || 
      (arg.message && arg.message.includes('connection closed'))
    )
  );

  if (hasConnectionClosedError) {
    // Log as info instead of error
    // Using console.log ensures it doesn't trigger error monitoring alerts
    console.log('Info: Connection closed by client (suppressed error log)');
    return;
  }

  originalConsoleError(...args);
};

const app = new Hono();

// Password validation helper
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 6) {
    return { valid: false, error: 'Passwort muss mindestens 6 Zeichen lang sein' };
  }
  
  // Check for at least one special character
  const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
  if (!specialCharRegex.test(password)) {
    return { valid: false, error: 'Passwort muss mindestens ein Sonderzeichen enthalten (!@#$%^&*()_+-=[]{};\':"|,.<>/?)' };
  }
  
  return { valid: true };
}

// Week number calculation (ISO week)
function getWeekNumber(date: Date = new Date()): { weekNumber: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return {
    weekNumber,
    year: d.getUTCFullYear()
  };
}

// Get Monday of a given week
function getMondayOfWeek(weekNumber: number, year: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4DayOfWeek = jan4.getUTCDay() || 7;
  const mondayOfWeek1 = new Date(jan4.getTime() - (jan4DayOfWeek - 1) * 86400000);
  const targetMonday = new Date(mondayOfWeek1.getTime() + (weekNumber - 1) * 7 * 86400000);
  return targetMonday;
}

// Server Version Check
console.log('🚀 [BACKEND LOADED] Backend-Server gestartet - Nov 3, 2025, 14:30 - Mit umfangreichem Debug-Logging');

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper function to create Supabase admin client
const getSupabaseAdmin = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
};

// Helper function to create Supabase client for auth
const getSupabaseAuth = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  );
};

// Helper function to get user from access token
const getUserFromToken = async (accessToken: string | undefined) => {
  if (!accessToken) {
    return { user: null, error: 'No access token provided' };
  }
  
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !data.user) {
    return { user: null, error: error?.message || 'Invalid token' };
  }
  
  return { user: data.user, error: null };
};

// Helper to verify admin access
const verifyAdmin = async (accessToken: string | undefined) => {
  if (!accessToken) {
    return { isAdmin: false, error: 'No access token provided' };
  }
  
  // Use Auth client (ANON_KEY) to validate the token, not Admin client
  const supabase = getSupabaseAuth();
  const { data, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !data.user) {
    console.error('[verifyAdmin] Token validation failed:', error?.message);
    return { isAdmin: false, error: 'Invalid token' };
  }
  
  console.log('[verifyAdmin] User ID:', data.user.id);
  console.log('[verifyAdmin] User metadata:', data.user.user_metadata);
  
  // Try to find user in KV store
  // Method 1: Using firstName and lastName from metadata
  let userData = null;
  if (data.user.user_metadata?.firstName && data.user.user_metadata?.lastName) {
    const userKey = `user:${data.user.user_metadata.firstName.toLowerCase()}:${data.user.user_metadata.lastName.toLowerCase()}:${data.user.id}`;
    console.log('[verifyAdmin] Trying key with metadata:', userKey);
    userData = await kv.get(userKey);
  }
  
  // Method 2: Search all users with this ID (fallback)
  if (!userData) {
    console.log('[verifyAdmin] Metadata lookup failed, searching by prefix...');
    const allUsers = await kv.getByPrefix(`user:`);
    userData = allUsers.find((u: any) => u.userId === data.user.id);
    console.log('[verifyAdmin] Found by prefix search:', !!userData);
  }
  
  if (!userData) {
    console.log('[verifyAdmin] No user data found in KV store');
    return { isAdmin: false, error: 'User not found in database' };
  }
  
  console.log('[verifyAdmin] User role:', userData.role);
  
  if (userData.role !== 'admin') {
    console.log('[verifyAdmin] Access denied - not admin');
    return { isAdmin: false, error: 'Not authorized as admin' };
  }
  
  console.log('[verifyAdmin] Admin access granted');
  return { isAdmin: true, user: data.user, error: null };
};

// Health check endpoint
app.get("/make-server-fb86b8a8/health", (c) => {
  return c.json({ status: "ok" });
});

// Debug endpoint - list all users (only in development)
app.get("/make-server-fb86b8a8/debug/users", async (c) => {
  try {
    const allUsers = await kv.getByPrefix("user:");
    
    // Return sanitized user list (without sensitive data)
    const userList = allUsers.map((user: any) => ({
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      hasChildProfile: !!user.childProfile
    }));

    return c.json({ 
      count: userList.length,
      users: userList 
    });
  } catch (error) {
    console.error('Debug error:', error);
    return c.json({ error: 'Fehler beim Abrufen der User-Liste' }, 500);
  }
});

// ========== USER ROUTES ==========

// User Signup
app.post("/make-server-fb86b8a8/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { firstName, lastName, password, childProfile: providedChildProfile, familyProfile: providedFamilyProfile } = body;

    if (!firstName || !lastName || !password) {
      return c.json({ error: 'Alle Felder sind erforderlich' }, 400);
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return c.json({ error: passwordValidation.error }, 400);
    }

    // Normalize names (trim whitespace)
    const firstNameNormalized = firstName.trim();
    const lastNameNormalized = lastName.trim();

    if (!firstNameNormalized || !lastNameNormalized) {
      return c.json({ error: 'Vor- und Nachname dürfen nicht leer sein' }, 400);
    }

    const supabase = getSupabaseAdmin();
    
    // Create unique email from name (always lowercase)
    const email = `${firstNameNormalized.toLowerCase()}.${lastNameNormalized.toLowerCase()}@hort-auma.local`;
    
    console.log(`Registration attempt for: ${firstNameNormalized} ${lastNameNormalized} (email: ${email})`);
    
    // Check if user already exists
    const existingUsers = await kv.getByPrefix(`user:${firstNameNormalized.toLowerCase()}:${lastNameNormalized.toLowerCase()}`);
    if (existingUsers.length > 0) {
      console.log(`User already exists: ${firstNameNormalized} ${lastNameNormalized}`);
      return c.json({ error: 'Ein Konto mit diesem Namen existiert bereits' }, 400);
    }

    // Use provided childProfile and familyProfile, or create empty defaults
    const childProfile = providedChildProfile || {};
    const familyProfile = providedFamilyProfile || {
      children: [],
      parentPhone: undefined,
      emergencyContactName: undefined,
      emergencyContactPhone: undefined
    };

    console.log('[SIGNUP] Saving user with:', {
      parent: `${firstNameNormalized} ${lastNameNormalized}`,
      childProfile,
      familyProfile,
      childrenCount: familyProfile?.children?.length || 0
    });

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        firstName: firstNameNormalized, 
        lastName: lastNameNormalized,
        childProfile,
        familyProfile
      },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error('Signup error:', error);
      
      // More specific error messages
      if (error.message.includes('already registered')) {
        return c.json({ error: 'Ein Konto mit diesem Namen existiert bereits in der Datenbank' }, 400);
      }
      
      return c.json({ error: error.message }, 400);
    }

    // Store user data in KV
    await kv.set(`user:${firstNameNormalized.toLowerCase()}:${lastNameNormalized.toLowerCase()}:${data.user.id}`, {
      userId: data.user.id,
      firstName: firstNameNormalized,
      lastName: lastNameNormalized,
      email,
      childProfile,
      familyProfile,
      role: 'parent', // Default role for new users
      adminPasswordNote: password, // Store password for admin reference
      createdAt: new Date().toISOString()
    });

    console.log(`Successfully registered: ${firstNameNormalized} ${lastNameNormalized} with ID: ${data.user.id}`);

    return c.json({ 
      success: true,
      message: 'Registrierung erfolgreich!' 
    });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// User Login
app.post("/make-server-fb86b8a8/login", async (c) => {
  try {
    const body = await c.req.json();
    const { firstName, lastName, password } = body;

    if (!firstName || !lastName || !password) {
      console.log(`❌ Login validation failed - firstName: '${firstName}', lastName: '${lastName}', password: ${password ? 'provided' : 'missing'}`);
      return c.json({ error: 'Bitte Vor- und Nachnamen sowie Passwort eingeben' }, 400);
    }

    // Normalize names (trim and convert to lowercase for email)
    const firstNameNormalized = firstName.trim();
    const lastNameNormalized = lastName.trim();

    const supabase = getSupabaseAuth();
    const email = `${firstNameNormalized.toLowerCase()}.${lastNameNormalized.toLowerCase()}@hort-auma.local`;

    console.log(`Login attempt for: ${firstNameNormalized} ${lastNameNormalized} (email: ${email})`);

    // First check if user exists in KV store
    const userKeys = await kv.getByPrefix(`user:${firstNameNormalized.toLowerCase()}:${lastNameNormalized.toLowerCase()}`);
    
    if (userKeys.length === 0) {
      console.log(`User not found in KV store: ${firstNameNormalized} ${lastNameNormalized}`);
      return c.json({ error: 'Kein Account mit diesem Namen gefunden. Bitte zuerst registrieren.' }, 401);
    }

    console.log(`🔑 Attempting auth with email: ${email}`);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Login error:', error);
      console.log(`Failed login for email: ${email}, error code: ${error.status}, message: ${error.message}`);
      
      // More specific error messages
      if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
        console.log('🔍 Invalid credentials detected. Checking user data and attempting repair if needed...');
        
        const adminSupabase = getSupabaseAdmin();
        const userData = userKeys[0];
        
        console.log('📋 User data from KV store:', {
          firstName: userData.firstName,
          lastName: userData.lastName,
          hasUserId: !!userData.userId,
          role: userData.role
        });
        
        // Attempt to create the user. 
        // If user exists in Auth, this fails. If missing, it succeeds (Repair).
        const { data: newUserData, error: createError } = await adminSupabase.auth.admin.createUser({
          email,
          password,
          user_metadata: { 
            firstName: userData.firstName, 
            lastName: userData.lastName,
            childProfile: userData.childProfile || {},
            familyProfile: userData.familyProfile || {}
          },
          email_confirm: true
        });
        
        // Case 1: Repair successful (User was missing, now created)
        if (!createError && newUserData?.user) {
          console.log('✅ Account repaired successfully (Auth entry was missing). Retrying login...');
          
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (retryError) {
            console.error('❌ Login still failed after successful repair:', retryError);
            return c.json({ 
              error: 'Account wurde repariert, aber Login fehlgeschlagen. Bitte erneut versuchen oder Admin kontaktieren.' 
            }, 500);
          }
          
          console.log(`✅ Login successful after repair for: ${firstNameNormalized} ${lastNameNormalized}`);
          
          return c.json({
            success: true,
            accessToken: retryData.session?.access_token,
            user: {
              id: retryData.user.id,
              firstName: userData.firstName,
              lastName: userData.lastName,
              childProfile: userData.childProfile || {},
              familyProfile: userData.familyProfile || {},
              role: userData.role || 'parent'
            }
          });
        }
        
        // Case 2: User exists (Create failed), so password was actually wrong
        if (createError) {
          console.log(`🔐 User exists in Auth. Error type: ${createError.message}`);
          
          // Check if it's because user already exists
          if (createError.message.includes('already registered') || createError.message.includes('already exists')) {
            console.log('ℹ️ User account exists - password is incorrect');
            return c.json({ 
              error: 'Falsches Passwort. Bitte überprüfen Sie Ihr Passwort oder nutzen Sie "Passwort vergessen".' 
            }, 401);
          }
          
          // Other creation error
          console.error('⚠️ Unexpected error during repair attempt:', createError);
          return c.json({ 
            error: 'Login-Fehler. Bitte versuchen Sie es erneut oder kontaktieren Sie den Administrator.' 
          }, 401);
        }
      }
      
      if (error.message.includes('Email not confirmed')) {
        return c.json({ error: 'E-Mail nicht bestätigt' }, 401);
      }
      
      return c.json({ error: 'Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre Eingaben.' }, 401);
    }

    console.log(`✅ Auth successful for email: ${email}`);

    const userData = userKeys[0];

    console.log(`Successful login for: ${firstNameNormalized} ${lastNameNormalized}`);
    console.log(`User role: ${userData?.role || 'parent'}`);

    return c.json({ 
      success: true,
      accessToken: data.session.access_token,
      user: {
        firstName: userData?.firstName || firstNameNormalized,
        lastName: userData?.lastName || lastNameNormalized,
        childProfile: userData?.childProfile || {},
        familyProfile: userData?.familyProfile,
        role: userData?.role || 'parent' // Default: parent
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Password Reset Request
app.post("/make-server-fb86b8a8/reset-password", async (c) => {
  try {
    const body = await c.req.json();
    const { firstName, lastName } = body;

    if (!firstName || !lastName) {
      return c.json({ error: 'Vor- und Nachname sind erforderlich' }, 400);
    }

    // Normalize names
    const firstNameNormalized = firstName.trim();
    const lastNameNormalized = lastName.trim();

    console.log(`🔐 Password reset request for: ${firstNameNormalized} ${lastNameNormalized}`);

    // Check if user exists
    const userKeys = await kv.getByPrefix(`user:${firstNameNormalized.toLowerCase()}:${lastNameNormalized.toLowerCase()}`);
    
    if (userKeys.length === 0) {
      console.log(`❌ User not found for password reset: ${firstNameNormalized} ${lastNameNormalized}`);
      return c.json({ error: 'Kein Account mit diesem Namen gefunden' }, 404);
    }

    const userData = userKeys[0];
    const userId = userData.userId;

    console.log(`📝 Found user with ID: ${userId}`);

    // Generate temporary password - simpler format for easier typing
    const tempPassword = `Temp${Math.floor(Math.random() * 900000 + 100000)}!`;

    // Update password in Supabase Auth
    const supabase = getSupabaseAdmin();
    const { data: updateData, error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: tempPassword }
    );

    if (error) {
      console.error('❌ Password reset error:', error);
      return c.json({ error: `Passwort konnte nicht zurückgesetzt werden: ${error.message}` }, 500);
    }

    console.log(`✅ Password reset successful for: ${firstNameNormalized} ${lastNameNormalized}`);
    console.log(`🔑 New temporary password set: ${tempPassword}`);

    // Send notification to admin (optional)
    try {
      const messageKey = `message:${Date.now()}-${Math.random().toString(36).substring(7)}`;
      await kv.set(messageKey, {
        id: messageKey,
        senderType: 'system',
        senderName: 'System',
        subject: 'Passwort zurückgesetzt',
        message: `Das Passwort für ${firstNameNormalized} ${lastNameNormalized} wurde zurückgesetzt. Neues temporäres Passwort: ${tempPassword}`,
        timestamp: new Date().toISOString(),
        read: false,
      });
      console.log('📧 Admin notification sent');
    } catch (notificationError) {
      // Notification error should not fail the password reset
      console.warn('⚠️ Failed to send admin notification:', notificationError);
    }

    return c.json({ 
      success: true,
      temporaryPassword: tempPassword,
      message: 'Passwort wurde erfolgreich zurückgesetzt',
      email: `${firstNameNormalized.toLowerCase()}.${lastNameNormalized.toLowerCase()}@hort-auma.local`
    });
  } catch (error) {
    console.error('❌ Password reset error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Get User Profile
app.get("/make-server-fb86b8a8/user", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);

    if (error || !user) {
      return c.json({ error: 'Nicht autorisiert' }, 401);
    }

    // Try to get user data from KV store
    const userKeys = await kv.getByPrefix(`user:`);
    const userData = userKeys.find((u: any) => u.userId === user.id);

    // Use metadata as fallback
    const firstName = userData?.firstName || user.user_metadata?.firstName || '';
    const lastName = userData?.lastName || user.user_metadata?.lastName || '';
    const childProfile = userData?.childProfile || user.user_metadata?.childProfile || {};
    const familyProfile = userData?.familyProfile || user.user_metadata?.familyProfile;

    if (!firstName || !lastName) {
      console.error('User data incomplete. userId:', user.id, 'metadata:', user.user_metadata);
      return c.json({ error: 'Benutzerprofil unvollständig' }, 404);
    }

    return c.json({
      firstName,
      lastName,
      childProfile,
      familyProfile,
      role: userData?.role || 'parent' // Include role in response
    });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Update User Profile
app.put("/make-server-fb86b8a8/user/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);

    if (error || !user) {
      return c.json({ error: 'Nicht autorisiert' }, 401);
    }

    const body = await c.req.json();
    const { firstName, lastName, childProfile, familyProfile, password } = body;

    // Get current user data
    const userKeys = await kv.getByPrefix(`user:`);
    const currentUserData = userKeys.find((u: any) => u.userId === user.id);

    if (!currentUserData) {
      return c.json({ error: 'Benutzer nicht gefunden' }, 404);
    }

    // Update password if provided
    if (password) {
      const supabase = getSupabaseAdmin();
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password }
      );

      if (updateError) {
        console.error('Password update error:', updateError);
        return c.json({ error: 'Passwort konnte nicht aktualisiert werden' }, 400);
      }
    }

    // Update user metadata
    const supabase = getSupabaseAdmin();
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { firstName, lastName, childProfile, familyProfile }
    });

    // Build the new user key
    const oldKey = Object.keys(await kv.mget([`user:${currentUserData.firstName.toLowerCase()}:${currentUserData.lastName.toLowerCase()}:${user.id}`]))[0];
    const newKey = `user:${firstName.toLowerCase()}:${lastName.toLowerCase()}:${user.id}`;

    // Delete old key if name changed
    if (oldKey && oldKey !== newKey) {
      await kv.del(oldKey);
    }

    // Save updated data
    await kv.set(newKey, {
      userId: user.id,
      firstName,
      lastName,
      childProfile,
      familyProfile,
      createdAt: currentUserData.createdAt,
      updatedAt: new Date().toISOString()
    });

    return c.json({ 
      success: true,
      message: 'Profil erfolgreich aktualisiert'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// ========== HORTZETTEL ROUTES ==========

// Get all Hortzettel for current user
app.get("/make-server-fb86b8a8/hortzettel", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);

    if (error || !user) {
      return c.json({ error: 'Nicht autorisiert' }, 401);
    }

    const hortzettelList = await kv.getByPrefix(`hortzettel:${user.id}`);
    
    console.log('[GET HORTZETTEL] ========================================');
    console.log('[GET HORTZETTEL] Anzahl Hortzettel:', hortzettelList.length);
    console.log('[GET HORTZETTEL] Alle Hortzettel mit Wochennummern:', hortzettelList.map((h: any) => ({
      id: h.id,
      weekNumber: h.weekNumber,
      year: h.year,
      status: h.status,
      childName: h.childName
    })));
    console.log('[GET HORTZETTEL] Aktuelle Woche:', getWeekNumber());
    console.log('[GET HORTZETTEL] ========================================');
    
    return c.json({ 
      hortzettel: hortzettelList.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });
  } catch (error) {
    console.error('Get hortzettel error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Create new Hortzettel
app.post("/make-server-fb86b8a8/hortzettel", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);

    if (error || !user) {
      return c.json({ error: 'Nicht autorisiert' }, 401);
    }

    const body = await c.req.json();
    const hortzettelData = body;

    console.log('[CREATE HORTZETTEL] =================================');
    console.log('[CREATE HORTZETTEL] Empfangene Daten:', {
      childName: hortzettelData.childName,
      class: hortzettelData.class,
      userId: user.id
    });

    // Get current week number
    const { weekNumber, year } = getWeekNumber();
    console.log('[CREATE HORTZETTEL] ⚠️ WOCHENNUMMER BERECHNET:', { weekNumber, year, currentDate: new Date().toISOString() });

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const hortzettel = {
      ...hortzettelData,
      id,
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mondayEdits: 0,
      tuesdayEdits: 0,
      wednesdayEdits: 0,
      thursdayEdits: 0,
      fridayEdits: 0,
      weekNumber,
      year,
      status: 'aktiv'
    };

    console.log('[CREATE HORTZETTEL] ⚠️ VOLLSTÄNDIGER HORTZETTEL:', {
      id: hortzettel.id,
      childName: hortzettel.childName,
      class: hortzettel.class,
      weekNumber: hortzettel.weekNumber,
      year: hortzettel.year,
      status: hortzettel.status,
      key: `hortzettel:${user.id}:${id}`
    });

    await kv.set(`hortzettel:${user.id}:${id}`, hortzettel);

    console.log('[CREATE HORTZETTEL] ✅ Erfolgreich gespeichert');
    console.log('[CREATE HORTZETTEL] =================================');

    return c.json({ 
      success: true,
      hortzettel
    });
  } catch (error) {
    console.error('Create hortzettel error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Update Hortzettel
app.put("/make-server-fb86b8a8/hortzettel/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);

    if (error || !user) {
      return c.json({ error: 'Nicht autorisiert' }, 401);
    }

    const id = c.req.param('id');
    const body = await c.req.json();
    
    const existingKey = `hortzettel:${user.id}:${id}`;
    const existing = await kv.get(existingKey);

    if (!existing) {
      return c.json({ error: 'Hortzettel nicht gefunden' }, 404);
    }

    // Calculate edit counts
    const updatedData = { ...body };
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    
    days.forEach(day => {
      const editKey = `${day}Edits`;
      const otherKey = `${day}Other`;
      
      // Check if either the main value OR the "Other" field changed
      const mainChanged = existing[day] !== body[day];
      const otherChanged = existing[otherKey] !== body[otherKey];
      
      if (mainChanged || otherChanged) {
        updatedData[editKey] = (existing[editKey] || 0) + 1;
      } else {
        updatedData[editKey] = existing[editKey] || 0;
      }
    });

    const hortzettel = {
      ...updatedData,
      id,
      userId: user.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString()
    };

    await kv.set(existingKey, hortzettel);

    return c.json({ 
      success: true,
      hortzettel
    });
  } catch (error) {
    console.error('Update hortzettel error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Delete Hortzettel
app.delete("/make-server-fb86b8a8/hortzettel/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);

    if (error || !user) {
      return c.json({ error: 'Nicht autorisiert' }, 401);
    }

    const id = c.req.param('id');
    await kv.del(`hortzettel:${user.id}:${id}`);

    return c.json({ 
      success: true,
      message: 'Hortzettel gelöscht'
    });
  } catch (error) {
    console.error('Delete hortzettel error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Auto-Archive Old Hortzettel (archives all Hortzettel from past weeks)
// NOTE: Hort week is Monday-Friday, so we archive on Saturday/Sunday
app.post("/make-server-fb86b8a8/hortzettel/auto-archive", async (c) => {
  try {
    console.log('[AUTO-ARCHIVE] Starting auto-archive process');
    
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Get current week
    const currentWeek = getWeekNumber(now);
    console.log(`[AUTO-ARCHIVE] Current week: KW ${currentWeek.weekNumber}, ${currentWeek.year}, Day: ${dayOfWeek} (0=Sun, 6=Sat)`);
    
    // Get all Hortzettel
    const allHortzettel = await kv.getByPrefix('hortzettel:');
    console.log(`[AUTO-ARCHIVE] Found ${allHortzettel.length} total Hortzettel`);
    
    let archivedCount = 0;
    let skippedCount = 0;
    
    for (const hortzettel of allHortzettel) {
      // Skip if already archived
      if (hortzettel.status === 'archiviert') {
        skippedCount++;
        continue;
      }
      
      let isPastWeek = false;
      const hortzettelWeek = hortzettel.weekNumber;
      const hortzettelYear = hortzettel.year;
      
      console.log(`[AUTO-ARCHIVE] Checking: ${hortzettel.id} - Week: ${hortzettelWeek}, Year: ${hortzettelYear}, createdAt: ${hortzettel.createdAt}, status: ${hortzettel.status}`);
      
      // Check if week/year is set and in the past
      if (hortzettelWeek && hortzettelYear) {
        // If it's Saturday (6) or Sunday (0), archive current week too (since Hort week is Mon-Fri)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          isPastWeek = 
            hortzettelYear < currentWeek.year || 
            (hortzettelYear === currentWeek.year && hortzettelWeek <= currentWeek.weekNumber);
          console.log(`[AUTO-ARCHIVE]   -> Weekend mode: archiving current week too. isPastWeek: ${isPastWeek}`);
        } else {
          // Mon-Fri: only archive previous weeks
          isPastWeek = 
            hortzettelYear < currentWeek.year || 
            (hortzettelYear === currentWeek.year && hortzettelWeek < currentWeek.weekNumber);
          console.log(`[AUTO-ARCHIVE]   -> Weekday mode: only past weeks. isPastWeek: ${isPastWeek}`);
        }
      } else if (hortzettel.createdAt) {
        // Fallback: Check if createdAt is more than 7 days old
        const createdDate = new Date(hortzettel.createdAt);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        isPastWeek = createdDate < sevenDaysAgo;
        console.log(`[AUTO-ARCHIVE]   -> Using createdAt fallback. createdDate: ${createdDate}, sevenDaysAgo: ${sevenDaysAgo}, isPastWeek: ${isPastWeek}`);
      } else {
        console.log(`[AUTO-ARCHIVE]   -> No week/year and no createdAt - cannot determine age, skipping`);
      }
      
      if (isPastWeek) {
        // Update status to archived
        const key = `hortzettel:${hortzettel.userId}:${hortzettel.id}`;
        const updatedHortzettel = {
          ...hortzettel,
          status: 'archiviert',
          updatedAt: new Date().toISOString()
        };
        
        await kv.set(key, updatedHortzettel);
        archivedCount++;
        console.log(`[AUTO-ARCHIVE] ✅ Archived: ${key} (KW ${hortzettelWeek || 'N/A'}, ${hortzettelYear || 'created: ' + hortzettel.createdAt})`);
      }
    }
    
    console.log(`[AUTO-ARCHIVE] Completed: ${archivedCount} archived, ${skippedCount} already archived, ${allHortzettel.length - archivedCount - skippedCount} active`);
    
    return c.json({ 
      success: true,
      archivedCount,
      message: `${archivedCount} Hortzettel automatisch archiviert`
    });
  } catch (error) {
    console.error('[AUTO-ARCHIVE] Error:', error);
    return c.json({ error: 'Fehler beim Archivieren' }, 500);
  }
});

// ========== HORTNER ROUTES ==========

// Hortner Login
app.post("/make-server-fb86b8a8/hortner/login", async (c) => {
  try {
    const body = await c.req.json();
    const { password, klasse } = body;

    if (!klasse || !password) {
      return c.json({ error: 'Alle Felder sind erforderlich' }, 400);
    }

    // Get hortner passwords from settings
    const settings = await kv.get('settings');
    
    // Default passwords if settings don't exist
    const defaultPasswords: Record<string, string> = {
      'hort-1': 'hortner1',
      'hort-2': 'hortner2',
      'hort-3': 'hortner3',
      'hort-4': 'hortner4'
    };

    const hortnerPasswords = settings?.hortnerPasswords || defaultPasswords;

    if (hortnerPasswords[klasse] !== password) {
      return c.json({ error: 'Ungültiges Passwort' }, 401);
    }

    return c.json({ 
      success: true,
      klasse
    });
  } catch (error) {
    console.error('Hortner login error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Get all Hortzettel for Hortner
app.get("/make-server-fb86b8a8/hortner/hortzettel", async (c) => {
  try {
    const allHortzettel = await kv.getByPrefix('hortzettel:');
    
    console.log('[HORTNER] =================================');
    console.log('[HORTNER] Geladene Hortzettel:', allHortzettel.length);
    console.log('[HORTNER] Hortzettel-Details:');
    allHortzettel.forEach((h: any) => {
      const isEdited = h.updatedAt && h.createdAt && new Date(h.updatedAt).getTime() > new Date(h.createdAt).getTime() + 1000;
      console.log(`  - ID: ${h.id}, Kind: ${h.childName}, Hortgruppe: "${h.class}", Status: ${h.status || 'aktiv'}, Bearbeitet: ${isEdited ? 'JA' : 'NEIN'}, createdAt: ${h.createdAt}, updatedAt: ${h.updatedAt || 'nicht gesetzt'}`);
    });
    console.log('[HORTNER] Eindeutige Hortgruppen:', [...new Set(allHortzettel.map((h: any) => h.class))]);
    console.log('[HORTNER] =================================');
    
    return c.json({ 
      hortzettel: allHortzettel.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });
  } catch (error) {
    console.error('Get hortner hortzettel error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Archive completed weeks' Hortzettel
// A school week runs from Monday to Friday
// Only archive weeks where the Monday of the NEXT week has already started
app.post("/make-server-fb86b8a8/hortner/archive-week", async (c) => {
  try {
    const allHortzettel = await kv.getByPrefix('hortzettel:');
    const now = new Date();
    const { weekNumber: currentWeek, year: currentYear } = getWeekNumber(now);
    
    let archivedCount = 0;
    const archivedWeeks = new Set<string>();
    
    // Archive all hortzettel from past weeks that are still active
    // A week is considered "past" if we are in a newer week (current week number is higher)
    for (const hortzettel of allHortzettel) {
      // Skip if already archived or no week data
      if (hortzettel.status === 'archiviert' || !hortzettel.weekNumber || !hortzettel.year) {
        continue;
      }
      
      // Check if this Hortzettel is from a past week
      const isPastWeek = hortzettel.year < currentYear || 
                         (hortzettel.year === currentYear && hortzettel.weekNumber < currentWeek);
      
      if (isPastWeek) {
        const key = `hortzettel:${hortzettel.userId}:${hortzettel.id}`;
        await kv.set(key, {
          ...hortzettel,
          status: 'archiviert',
          archivedAt: new Date().toISOString()
        });
        archivedCount++;
        archivedWeeks.add(`KW ${hortzettel.weekNumber}, ${hortzettel.year}`);
      }
    }

    const weeksList = Array.from(archivedWeeks).join(', ');
    const message = archivedCount > 0 
      ? `${archivedCount} Hortzettel aus ${archivedWeeks.size} ${archivedWeeks.size === 1 ? 'Woche' : 'Wochen'} archiviert (${weeksList})`
      : 'Keine Hortzettel zum Archivieren gefunden';

    return c.json({ 
      success: true,
      archivedCount,
      message
    });
  } catch (error) {
    console.error('Archive week error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// ========== ANNOUNCEMENT ROUTES ==========

// Get all announcements
app.get("/make-server-fb86b8a8/announcements", async (c) => {
  try {
    const announcements = await kv.getByPrefix('announcement:');
    
    return c.json({ 
      announcements: announcements.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Create announcement
app.post("/make-server-fb86b8a8/announcements", async (c) => {
  try {
    const body = await c.req.json();
    const { title, message, type, createdBy } = body;

    if (!title || !message || !type) {
      return c.json({ error: 'Titel, Nachricht und Typ sind erforderlich' }, 400);
    }

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const announcement = {
      id,
      title,
      message,
      type,
      createdBy: createdBy || 'Hortner',
      createdAt: new Date().toISOString()
    };

    await kv.set(`announcement:${id}`, announcement);

    return c.json({ 
      success: true,
      announcement
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Delete announcement
app.delete("/make-server-fb86b8a8/announcements/:id", async (c) => {
  try {
    const id = c.req.param('id');
    await kv.del(`announcement:${id}`);

    return c.json({ 
      success: true,
      message: 'Mitteilung gelöscht'
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// ========== TEMPLATE ROUTES ==========

// Get user's templates
app.get("/make-server-fb86b8a8/templates", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Nicht autorisiert' }, 401);
    }

    const templates = await kv.getByPrefix(`template:${user.id}:`);
    
    return c.json({ 
      templates: templates.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });
  } catch (error) {
    console.error('Get templates error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Create template
app.post("/make-server-fb86b8a8/templates", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Nicht autorisiert' }, 401);
    }

    const body = await c.req.json();
    const { name, data } = body;

    if (!name || !data) {
      return c.json({ error: 'Name und Daten sind erforderlich' }, 400);
    }

    const templateId = crypto.randomUUID();
    const template = {
      id: templateId,
      name,
      class: data.class,
      canGoHomeAlone: data.canGoHomeAlone,
      canGoHomeAloneOther: data.canGoHomeAloneOther,
      monday: data.monday,
      mondayOther: data.mondayOther,
      tuesday: data.tuesday,
      tuesdayOther: data.tuesdayOther,
      wednesday: data.wednesday,
      wednesdayOther: data.wednesdayOther,
      thursday: data.thursday,
      thursdayOther: data.thursdayOther,
      friday: data.friday,
      fridayOther: data.fridayOther,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`template:${user.id}:${templateId}`, template);

    return c.json({ 
      success: true,
      template
    });
  } catch (error) {
    console.error('Create template error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Update template (rename)
app.put("/make-server-fb86b8a8/templates/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Nicht autorisiert' }, 401);
    }

    const templateId = c.req.param('id');
    const body = await c.req.json();
    const { name } = body;

    if (!name) {
      return c.json({ error: 'Name ist erforderlich' }, 400);
    }

    const key = `template:${user.id}:${templateId}`;
    const template = await kv.get(key);

    if (!template) {
      return c.json({ error: 'Vorlage nicht gefunden' }, 404);
    }

    const updatedTemplate = {
      ...template,
      name
    };

    await kv.set(key, updatedTemplate);

    return c.json({ 
      success: true,
      template: updatedTemplate
    });
  } catch (error) {
    console.error('Update template error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Delete template
app.delete("/make-server-fb86b8a8/templates/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Nicht autorisiert' }, 401);
    }

    const templateId = c.req.param('id');
    await kv.del(`template:${user.id}:${templateId}`);

    return c.json({ 
      success: true,
      message: 'Vorlage gelöscht'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// ========== ADMIN ROUTES ==========

// Admin Setup - Creates default admin if none exists
app.post("/make-server-fb86b8a8/admin/setup", async (c) => {
  try {
    console.log('[ADMIN SETUP] Starting admin setup...');
    
    // Check if any admin already exists
    const allUsers = await kv.getByPrefix('user:');
    const adminExists = allUsers.some((u: any) => u.role === 'admin');
    
    if (adminExists) {
      console.log('[ADMIN SETUP] Admin already exists');
      return c.json({ 
        success: false,
        error: 'Ein Admin-Konto existiert bereits',
        message: 'Verwenden Sie die bestehenden Admin-Zugangsdaten'
      });
    }
    
    const body = await c.req.json();
    const { email, password, firstName = 'Admin', lastName = 'User' } = body;
    
    if (!email || !password) {
      return c.json({ error: 'E-Mail und Passwort sind erforderlich' }, 400);
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return c.json({ error: passwordValidation.error }, 400);
    }
    
    const supabase = getSupabaseAdmin();
    
    // Create admin user in Supabase Auth
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        firstName, 
        lastName,
      },
      email_confirm: true
    });
    
    if (createError) {
      console.error('[ADMIN SETUP] Create user error:', createError);
      return c.json({ error: createError.message }, 400);
    }
    
    console.log('[ADMIN SETUP] Admin user created in Auth:', data.user.id);
    
    // Store admin data in KV with admin role
    const userKey = `user:${firstName.toLowerCase()}:${lastName.toLowerCase()}:${data.user.id}`;
    await kv.set(userKey, {
      userId: data.user.id,
      firstName,
      lastName,
      email,
      role: 'admin',
      childProfile: {},
      createdAt: new Date().toISOString()
    });
    
    console.log('[ADMIN SETUP] Admin user stored in KV:', userKey);
    
    return c.json({ 
      success: true,
      message: 'Admin-Konto erfolgreich erstellt!',
      admin: {
        email,
        firstName,
        lastName
      }
    });
  } catch (error) {
    console.error('[ADMIN SETUP] Exception:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten', details: String(error) }, 500);
  }
});

// Admin Login
app.post("/make-server-fb86b8a8/admin/login", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    console.log('[ADMIN LOGIN] Attempt for email:', email);

    if (!email || !password) {
      console.log('[ADMIN LOGIN] Missing email or password');
      return c.json({ error: 'E-Mail und Passwort sind erforderlich' }, 400);
    }

    const supabase = getSupabaseAuth();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      console.error('[ADMIN LOGIN] Auth error:', error?.message || 'No session');
      return c.json({ 
        error: 'Ungültige Anmeldedaten',
        details: error?.message 
      }, 401);
    }

    console.log('[ADMIN LOGIN] Auth successful for user:', data.user.id);

    // Verify admin role
    const userKey = `user:${data.user.user_metadata.firstName?.toLowerCase()}:${data.user.user_metadata.lastName?.toLowerCase()}:${data.user.id}`;
    console.log('[ADMIN LOGIN] Looking for KV key:', userKey);
    
    const userData = await kv.get(userKey);
    console.log('[ADMIN LOGIN] KV data found:', userData ? 'Yes' : 'No');
    console.log('[ADMIN LOGIN] KV data role:', userData?.role);

    if (!userData || userData.role !== 'admin') {
      console.log('[ADMIN LOGIN] Access denied - not admin');
      return c.json({ 
        error: 'Kein Admin-Zugriff',
        debug: {
          userKey,
          hasData: !!userData,
          role: userData?.role
        }
      }, 403);
    }

    console.log('[ADMIN LOGIN] Success! Admin access granted');
    return c.json({
      success: true,
      accessToken: data.session.access_token,
      admin: {
        email: data.user.email,
      }
    });
  } catch (error) {
    console.error('[ADMIN LOGIN] Exception:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten', details: String(error) }, 500);
  }
});

// Get system statistics
app.get("/make-server-fb86b8a8/admin/stats", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin, error } = await verifyAdmin(accessToken);
    
    if (!isAdmin) {
      return c.json({ error: error || 'Nicht autorisiert' }, 403);
    }

    const allUsers = await kv.getByPrefix('user:');
    const allHortzettel = await kv.getByPrefix('hortzettel:');
    const allTemplates = await kv.getByPrefix('template:');

    const activeHortzettel = allHortzettel.filter((h: any) => h.status === 'aktiv');
    const archivedHortzettel = allHortzettel.filter((h: any) => h.status === 'archiviert');

    // Calculate class distribution
    const classCounts: Record<string, number> = {};
    allHortzettel.forEach((h: any) => {
      if (h.class) {
        classCounts[h.class] = (classCounts[h.class] || 0) + 1;
      }
    });

    // Calculate popular times
    const popularTimes: Record<string, number> = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    allHortzettel.forEach((h: any) => {
      days.forEach(day => {
        const time = h[day];
        if (time && time !== 'krank' && time !== 'feiertag') {
          popularTimes[time] = (popularTimes[time] || 0) + 1;
        }
      });
    });

    // Calculate this week's submissions
    const { weekNumber, year } = getWeekNumber();
    const thisWeekSubmissions = allHortzettel.filter((h: any) => 
      h.weekNumber === weekNumber && h.year === year
    ).length;

    return c.json({
      stats: {
        totalUsers: allUsers.length,
        totalHortzettel: allHortzettel.length,
        activeHortzettel: activeHortzettel.length,
        archivedHortzettel: archivedHortzettel.length,
        totalTemplates: allTemplates.length,
        classCounts,
        popularTimes,
        thisWeekSubmissions,
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Get all users (admin view)
app.get("/make-server-fb86b8a8/admin/users", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin, error } = await verifyAdmin(accessToken);
    
    if (!isAdmin) {
      return c.json({ error: error || 'Nicht autorisiert' }, 403);
    }

    const allUsers = await kv.getByPrefix('user:');
    
    // Ensure all users have both id and userId for compatibility
    const usersWithIds = allUsers.map((user: any) => ({
      ...user,
      id: user.userId || user.id,
      userId: user.userId || user.id
    }));
    
    return c.json({ 
      users: usersWithIds.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Create new user (admin only)
app.post("/make-server-fb86b8a8/admin/users", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin, error } = await verifyAdmin(accessToken);
    
    if (!isAdmin) {
      return c.json({ error: error || 'Nicht autorisiert' }, 403);
    }

    const body = await c.req.json();
    const { firstName, lastName, password } = body;

    if (!firstName || !lastName || !password) {
      return c.json({ error: 'Alle Felder sind erforderlich' }, 400);
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return c.json({ error: passwordValidation.error }, 400);
    }

    const supabase = getSupabaseAdmin();
    
    // Create unique email from name
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@hort-auma.local`;
    
    // Check if user already exists
    const existingUsers = await kv.getByPrefix(`user:${firstName.toLowerCase()}:${lastName.toLowerCase()}`);
    if (existingUsers.length > 0) {
      return c.json({ error: 'Ein Konto mit diesem Namen existiert bereits' }, 400);
    }

    // Create familyProfile for user metadata
    const tempFamilyProfile = {
      children: [],
      parentPhone: undefined,
      emergencyContactName: undefined,
      emergencyContactPhone: undefined
    };

    // Create user in Supabase Auth
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        firstName, 
        lastName,
        childProfile: {},
        familyProfile: tempFamilyProfile
      },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (createError) {
      console.error('Create user error:', createError);
      return c.json({ error: createError.message }, 400);
    }

    // Store user data in KV
    await kv.set(`user:${firstName.toLowerCase()}:${lastName.toLowerCase()}:${data.user.id}`, {
      userId: data.user.id,
      firstName,
      lastName,
      email,
      childProfile: {},
      familyProfile: tempFamilyProfile,
      role: 'parent', // Default role for admin-created users
      adminPasswordNote: password, // Store password for admin reference
      createdAt: new Date().toISOString()
    });

    return c.json({ 
      success: true,
      message: 'Benutzer erfolgreich erstellt',
      user: {
        id: data.user.id,
        userId: data.user.id,
        firstName,
        lastName,
        email,
        childProfile: {},
        familyProfile: tempFamilyProfile,
        role: 'parent',
        adminPasswordNote: password, // Include in response for admin
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Reset user password
app.post("/make-server-fb86b8a8/admin/reset-password", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin, error } = await verifyAdmin(accessToken);
    
    if (!isAdmin) {
      return c.json({ error: error || 'Nicht autorisiert' }, 403);
    }

    const body = await c.req.json();
    const { userId, newPassword } = body;

    if (!userId || !newPassword) {
      return c.json({ error: 'Benutzer-ID und neues Passwort sind erforderlich' }, 400);
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return c.json({ error: passwordValidation.error }, 400);
    }

    const supabase = getSupabaseAdmin();
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Reset password error:', updateError);
      return c.json({ error: 'Passwort konnte nicht zurückgesetzt werden' }, 400);
    }

    // Update adminPasswordNote in KV store
    const allUsers = await kv.getByPrefix('user:');
    const userData = allUsers.find((u: any) => u.userId === userId);
    
    if (userData) {
      const userKey = `user:${userData.firstName.toLowerCase()}:${userData.lastName.toLowerCase()}:${userId}`;
      const updatedUserData = {
        ...userData,
        adminPasswordNote: newPassword // Update password note
      };
      await kv.set(userKey, updatedUserData);
    }

    return c.json({ 
      success: true,
      message: 'Passwort erfolgreich zurückgesetzt'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Update user role
app.put("/make-server-fb86b8a8/admin/users/:userId/role", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin, error } = await verifyAdmin(accessToken);
    
    if (!isAdmin) {
      return c.json({ error: error || 'Nicht autorisiert' }, 403);
    }

    const userId = c.req.param('userId');
    const body = await c.req.json();
    const { role } = body;

    if (!userId || !role) {
      return c.json({ error: 'Benutzer-ID und Rolle sind erforderlich' }, 400);
    }

    if (!['parent', 'hortner', 'admin'].includes(role)) {
      return c.json({ error: 'Ungültige Rolle. Erlaubt: parent, hortner, admin' }, 400);
    }

    console.log(`[UPDATE ROLE] Updating user ${userId} to role ${role}`);

    // Find user in KV store
    const allUsers = await kv.getByPrefix('user:');
    const userData = allUsers.find((u: any) => u.userId === userId);

    if (!userData) {
      console.error(`[UPDATE ROLE] User ${userId} not found`);
      return c.json({ error: 'Benutzer nicht gefunden' }, 404);
    }

    // Get the KV key
    const userKey = `user:${userData.firstName.toLowerCase()}:${userData.lastName.toLowerCase()}:${userId}`;
    
    // Update user data with new role
    const updatedUserData = {
      ...userData,
      role: role
    };

    await kv.set(userKey, updatedUserData);

    console.log(`[UPDATE ROLE] Successfully updated user ${userId} to role ${role}`);

    return c.json({ 
      success: true,
      message: `Rolle erfolgreich zu ${role} geändert`
    });
  } catch (error) {
    console.error('Update role error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Delete user
app.delete("/make-server-fb86b8a8/admin/users/:userId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin, error } = await verifyAdmin(accessToken);
    
    if (!isAdmin) {
      return c.json({ error: error || 'Nicht autorisiert' }, 403);
    }

    const userId = c.req.param('userId');
    
    if (!userId) {
      return c.json({ error: 'Benutzer-ID ist erforderlich' }, 400);
    }

    console.log(`[DELETE USER] Deleting user ${userId}`);

    // Find user in KV store
    const allUsers = await kv.getByPrefix('user:');
    const userData = allUsers.find((u: any) => u.userId === userId);

    if (!userData) {
      console.error(`[DELETE USER] User ${userId} not found in KV store`);
      return c.json({ error: 'Benutzer nicht gefunden' }, 404);
    }

    // Get the KV key
    const userKey = `user:${userData.firstName.toLowerCase()}:${userData.lastName.toLowerCase()}:${userId}`;
    
    console.log(`[DELETE USER] Deleting user from KV store: ${userKey}`);

    // Delete user from KV store
    await kv.del(userKey);

    // Delete user from Supabase Auth
    const supabase = getSupabaseAdmin();
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('[DELETE USER] Error deleting user from Supabase Auth:', deleteError);
      // Don't fail if auth deletion fails - user is already deleted from KV store
    } else {
      console.log(`[DELETE USER] Successfully deleted user from Supabase Auth`);
    }

    // Delete all Hortzettel associated with this user
    const allHortzettel = await kv.getByPrefix('hortzettel:');
    const userHortzettel = allHortzettel.filter((h: any) => h.userId === userId);
    
    console.log(`[DELETE USER] Found ${userHortzettel.length} Hortzettel to delete`);
    
    for (const hortzettel of userHortzettel) {
      const hortzettelKey = `hortzettel:${hortzettel.id}`;
      await kv.del(hortzettelKey);
      console.log(`[DELETE USER] Deleted Hortzettel: ${hortzettelKey}`);
    }

    console.log(`[DELETE USER] Successfully deleted user ${userId} and ${userHortzettel.length} Hortzettel`);

    return c.json({ 
      success: true,
      message: 'Benutzer erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten beim Löschen des Benutzers' }, 500);
  }
});

// Get app settings (PUBLIC - NO AUTH!)
app.get("/make-server-fb86b8a8/admin/settings", async (c) => {
  try {
    console.log('📖 GET /admin/settings - PUBLIC ENDPOINT (no auth required)');
    
    let settings = await kv.get('app:settings');
    
    // Default settings with complete content
    const defaultSettings = {
      schoolName: "Grundschule Auma",
      classes: ["Hort 1", "Hort 2", "Hort 3", "Hort 4"],
      timeOptions: [
        { value: "nach-unterricht", label: "Nach dem Unterricht" },
        { value: "nach-mittagessen", label: "Nach dem Mittagessen" },
        { value: "mittagsbus", label: "Mittagsbus" },
        { value: "nachmittagsbus", label: "Nachmittagsbus" },
        { value: "14:00", label: "14:00 Uhr" },
        { value: "15:00", label: "15:00 Uhr" },
        { value: "16:00", label: "ab 16:00 Uhr" },
        { value: "krank", label: "Krank" },
        { value: "feiertag", label: "Feiertag" },
        { value: "sonstiges", label: "Sonstiges:" },
      ],
      allowedHomeAloneOptions: [
        { value: "ja", label: "Ja" },
        { value: "nein", label: "Nein" },
        { value: "mit-geschwistern", label: "Mit Geschwistern" },
        { value: "sonstiges", label: "Sonstiges:" },
      ],
      colorThemes: [
        { name: "Blau", value: "blue", gradient: "from-slate-50 via-blue-50 to-indigo-50" },
        { name: "Grün", value: "green", gradient: "from-emerald-50 via-green-50 to-teal-50" },
        { name: "Violett", value: "purple", gradient: "from-purple-50 via-pink-50 to-rose-50" },
        { name: "Orange", value: "orange", gradient: "from-orange-50 via-amber-50 to-yellow-50" },
        { name: "Rosa", value: "pink", gradient: "from-pink-50 via-rose-50 to-red-50" },
        { name: "Grau", value: "gray", gradient: "from-slate-50 via-gray-50 to-zinc-50" },
      ],
      content: {
        appTitle: 'Hortzettel App',
        appSubtitle: 'Digitale Hortzettel-Verwaltung',
        welcomeMessage: 'Willkommen zurück!',
        loginTitle: 'Anmelden',
        loginSubtitle: 'Melden Sie sich mit Ihren Zugangsdaten an',
        registerTitle: 'Registrieren',
        registerSubtitle: 'Erstellen Sie ein neues Konto',
        loginButtonText: 'Anmelden',
        registerButtonText: 'Registrieren',
        dashboardWelcome: 'Willkommen',
        dashboardSubtitle: 'Verwalten Sie Ihre Hortzettel einfach und übersichtlich',
        createHortzettelButton: 'Neuer Hortzettel',
        myHortzettelButton: 'Meine Hortzettel',
        profileButton: 'Profil',
        hortzettelTitle: 'Hortzettel erstellen',
        hortzettelDescription: 'Füllen Sie die Betreuungszeiten für die kommende Woche aus',
        childNameLabel: 'Name des Kindes',
        classLabel: 'Klasse',
        homeAloneQuestion: 'Darf mein Kind alleine nach Hause gehen?',
        weekdayLabel: 'Wochentag',
        profileTitle: 'Profil & Kindinformationen',
        profileDescription: 'Verwalten Sie Ihre persönlichen Daten und Kindinformationen',
        adminDashboardTitle: 'Admin-Dashboard',
        settingsDescription: 'Verwalten Sie alle App-Einstellungen und Inhalte',
        hortnerDashboardTitle: 'Hortner-Dashboard',
        hortnerSubtitle: 'Übersicht aller Hortzettel',
        footerText: 'Erstellt mit ❤️ für Ihre Schule',
        privacyNotice: 'Ihre Daten werden vertraulich behandelt',
      }
    };
    
    // Merge settings with defaults
    let finalSettings;
    if (settings) {
      finalSettings = {
        schoolName: settings.schoolName || defaultSettings.schoolName,
        classes: settings.classes || defaultSettings.classes,
        timeOptions: settings.timeOptions || defaultSettings.timeOptions,
        allowedHomeAloneOptions: settings.allowedHomeAloneOptions || defaultSettings.allowedHomeAloneOptions,
        colorThemes: settings.colorThemes || defaultSettings.colorThemes,
        content: settings.content || defaultSettings.content
      };
    } else {
      finalSettings = defaultSettings;
    }
    
    console.log('📖 Returning settings with', Object.keys(finalSettings.content || {}).length, 'content fields');

    return c.json({ settings: finalSettings });
  } catch (error) {
    console.error('Get settings error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Update app settings (ADMIN ONLY)
app.put("/make-server-fb86b8a8/admin/settings", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin, error } = await verifyAdmin(accessToken);
    
    if (!isAdmin) {
      return c.json({ error: error || 'Nicht autorisiert' }, 403);
    }

    const body = await c.req.json();
    
    const currentSettings = await kv.get('app:settings') || {};
    const updatedSettings = {
      ...currentSettings,
      ...body,
    };

    await kv.set('app:settings', updatedSettings);

    return c.json({ 
      success: true,
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Update PWA settings (ADMIN ONLY)
app.put("/make-server-fb86b8a8/admin/pwa-settings", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin, error } = await verifyAdmin(accessToken);
    
    if (!isAdmin) {
      return c.json({ error: error || 'Nicht autorisiert' }, 403);
    }

    const pwaSettings = await c.req.json();
    console.log('📱 Updating PWA settings:', pwaSettings);
    
    // Store PWA settings in KV
    await kv.set('app:pwa_settings', pwaSettings);
    
    // Update manifest.json dynamically
    const manifest = {
      "name": pwaSettings.name,
      "short_name": pwaSettings.short_name,
      "description": pwaSettings.description,
      "start_url": "/",
      "scope": "/",
      "display": "standalone",
      "background_color": pwaSettings.background_color,
      "theme_color": pwaSettings.theme_color,
      "orientation": "portrait-primary",
      "icons": [
        {
          "src": "/app-icon.svg",
          "sizes": "any",
          "type": "image/svg+xml",
          "purpose": "any"
        },
        {
          "src": "/app-icon.svg",
          "sizes": "192x192 512x512",
          "type": "image/svg+xml",
          "purpose": "any maskable"
        }
      ],
      "categories": ["education", "productivity"],
      "lang": "de-DE",
      "dir": "ltr"
    };

    // Store the manifest
    await kv.set('app:manifest', manifest);

    console.log('✅ PWA settings updated successfully');

    return c.json({ 
      success: true,
      message: 'PWA-Einstellungen erfolgreich gespeichert'
    });
  } catch (error) {
    console.error('❌ Update PWA settings error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Get all hortzettel (admin view)
app.get("/make-server-fb86b8a8/admin/hortzettel", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin, error } = await verifyAdmin(accessToken);
    
    if (!isAdmin) {
      return c.json({ error: error || 'Nicht autorisiert' }, 403);
    }

    const allHortzettel = await kv.getByPrefix('hortzettel:');
    
    return c.json({ 
      hortzettel: allHortzettel.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });
  } catch (error) {
    console.error('Get admin hortzettel error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Export data
app.get("/make-server-fb86b8a8/admin/export", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin, error } = await verifyAdmin(accessToken);
    
    if (!isAdmin) {
      return c.json({ error: error || 'Nicht autorisiert' }, 403);
    }

    const format = c.req.query('format') || 'json';
    const allHortzettel = await kv.getByPrefix('hortzettel:');
    const allUsers = await kv.getByPrefix('user:');

    const exportData = {
      exportDate: new Date().toISOString(),
      hortzettel: allHortzettel,
      users: allUsers,
    };

    if (format === 'csv') {
      // Simple CSV for hortzettel
      let csv = 'Kind,Klasse,Montag,Dienstag,Mittwoch,Donnerstag,Freitag,Status,Erstellt\n';
      allHortzettel.forEach((h: any) => {
        csv += `"${h.childName}","${h.class}","${h.monday}","${h.tuesday}","${h.wednesday}","${h.thursday}","${h.friday}","${h.status || 'aktiv'}","${h.createdAt}"\n`;
      });

      return c.json({
        data: csv,
        filename: `hortzettel-export-${new Date().toISOString().split('T')[0]}.csv`
      });
    }

    return c.json({
      data: JSON.stringify(exportData, null, 2),
      filename: `hortzettel-export-${new Date().toISOString().split('T')[0]}.json`
    });
  } catch (error) {
    console.error('Export data error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// ========== MESSAGE ROUTES ==========

// Send message to admin (from parent)
app.post("/make-server-fb86b8a8/messages", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);

    if (error || !user) {
      return c.json({ error: 'Nicht autorisiert' }, 401);
    }

    const body = await c.req.json();
    const { subject, message } = body;

    if (!subject || !message) {
      return c.json({ error: 'Betreff und Nachricht sind erforderlich' }, 400);
    }

    // Get user name from user metadata or KV store
    let firstName = user.user_metadata?.firstName;
    let lastName = user.user_metadata?.lastName;

    // Fallback: Try to find user in KV store
    if (!firstName || !lastName) {
      console.log('User metadata missing, searching KV store for userId:', user.id);
      const userKeys = await kv.getByPrefix(`user:`);
      const userData = userKeys.find((u: any) => u.userId === user.id);

      if (userData) {
        firstName = userData.firstName;
        lastName = userData.lastName;
      }
    }

    // Final fallback: use email or "Unbekannt"
    const senderName = (firstName && lastName) 
      ? `${firstName} ${lastName}` 
      : user.email || 'Unbekannter Benutzer';

    console.log('Sending message from:', senderName, 'userId:', user.id);

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const messageKey = `message:${id}`;
    const messageData = {
      id,
      senderId: user.id,
      senderName,
      senderType: 'parent',
      subject,
      message,
      status: 'ungelesen',
      createdAt: new Date().toISOString(),
    };

    console.log('💾 Saving message with key:', messageKey, 'data:', { id, subject, senderName });
    await kv.set(messageKey, messageData);
    console.log('✅ Message saved successfully');

    return c.json({ 
      success: true,
      message: messageData
    });
  } catch (error) {
    console.error('Send message error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Send message to admin (from hortner)
app.post("/make-server-fb86b8a8/hortner/messages", async (c) => {
  try {
    const body = await c.req.json();
    const { klasse, subject, message } = body;

    if (!klasse || !subject || !message) {
      return c.json({ error: 'Klasse, Betreff und Nachricht sind erforderlich' }, 400);
    }

    // Map klasse to readable name
    const klasseLabels: Record<string, string> = {
      'klasse-1': 'Klasse 1',
      'klasse-2': 'Klasse 2',
      'klasse-3': 'Klasse 3',
      'klasse-4': 'Klasse 4',
    };

    const klasseLabel = klasseLabels[klasse] || klasse;

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const messageKey = `message:${id}`;
    const messageData = {
      id,
      senderId: `hortner:${klasse}`,
      senderName: `Hortner*in ${klasseLabel}`,
      senderType: 'hortner',
      klasse, // Store klasse for filtering
      subject,
      message,
      status: 'ungelesen',
      createdAt: new Date().toISOString(),
    };

    console.log('💾 Saving hortner message with key:', messageKey, 'data:', { id, subject, klasse });
    await kv.set(messageKey, messageData);
    console.log('✅ Hortner message saved successfully');

    return c.json({ 
      success: true,
      message: messageData
    });
  } catch (error) {
    console.error('Send hortner message error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Get messages for current user (parent)
app.get("/make-server-fb86b8a8/messages", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await getUserFromToken(accessToken);

    if (error || !user) {
      return c.json({ error: 'Nicht autorisiert' }, 401);
    }

    const allMessages = await kv.getByPrefix('message:');
    const userMessages = allMessages.filter((m: any) => m.senderId === user.id);
    
    return c.json({ 
      messages: userMessages.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Get messages for hortner by klasse
app.get("/make-server-fb86b8a8/hortner/messages/:klasse", async (c) => {
  try {
    const klasse = c.req.param('klasse');
    
    const allMessages = await kv.getByPrefix('message:');
    const hortnerMessages = allMessages.filter((m: any) => m.senderId === `hortner:${klasse}`);
    
    return c.json({ 
      messages: hortnerMessages.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });
  } catch (error) {
    console.error('Get hortner messages error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Get all messages (admin)
app.get("/make-server-fb86b8a8/admin/messages", async (c) => {
  try {
    console.log('📬 [GET /admin/messages] Fetching all messages');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin, error } = await verifyAdmin(accessToken);
    
    if (!isAdmin) {
      console.error('❌ Admin verification failed:', error);
      return c.json({ error: error || 'Nicht autorisiert' }, 403);
    }

    const allMessages = await kv.getByPrefix('message:');
    console.log(`✅ Found ${allMessages.length} messages`);
    console.log('📋 Message IDs:', allMessages.map((m: any) => m.id));
    
    return c.json({ 
      messages: allMessages.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    });
  } catch (error) {
    console.error('❌ Get admin messages error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Mark message as read (admin)
app.put("/make-server-fb86b8a8/admin/messages/:id/read", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin, error } = await verifyAdmin(accessToken);
    
    if (!isAdmin) {
      return c.json({ error: error || 'Nicht autorisiert' }, 403);
    }

    const id = c.req.param('id');
    const message = await kv.get(`message:${id}`);

    if (!message) {
      return c.json({ error: 'Nachricht nicht gefunden' }, 404);
    }

    const updatedMessage = {
      ...message,
      status: 'gelesen',
      readAt: new Date().toISOString()
    };

    await kv.set(`message:${id}`, updatedMessage);

    return c.json({ 
      success: true,
      message: updatedMessage
    });
  } catch (error) {
    console.error('Mark message as read error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Reply to message (admin)
app.put("/make-server-fb86b8a8/admin/messages/:id/reply", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin, error } = await verifyAdmin(accessToken);
    
    if (!isAdmin) {
      return c.json({ error: error || 'Nicht autorisiert' }, 403);
    }

    const id = c.req.param('id');
    const body = await c.req.json();
    const { reply } = body;

    if (!reply) {
      return c.json({ error: 'Antwort ist erforderlich' }, 400);
    }

    const message = await kv.get(`message:${id}`);

    if (!message) {
      return c.json({ error: 'Nachricht nicht gefunden' }, 404);
    }

    const updatedMessage = {
      ...message,
      status: 'beantwortet',
      adminReply: reply,
      repliedAt: new Date().toISOString()
    };

    await kv.set(`message:${id}`, updatedMessage);

    return c.json({ 
      success: true,
      message: updatedMessage
    });
  } catch (error) {
    console.error('Reply to message error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Mark reply as read (for parents/hortner)
app.put("/make-server-fb86b8a8/messages/:id/mark-reply-read", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Nicht autorisiert' }, 401);
    }

    const id = c.req.param('id');
    const message = await kv.get(`message:${id}`);

    if (!message) {
      return c.json({ error: 'Nachricht nicht gefunden' }, 404);
    }

    // Mark reply as read
    const updatedMessage = {
      ...message,
      replyRead: true,
      replyReadAt: new Date().toISOString()
    };

    await kv.set(`message:${id}`, updatedMessage);

    return c.json({ 
      success: true,
      message: updatedMessage
    });
  } catch (error) {
    console.error('Mark reply as read error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Delete message (admin)
app.delete("/make-server-fb86b8a8/admin/messages/:id", async (c) => {
  try {
    console.log('🗑️ [DELETE /admin/messages/:id] Starting delete request');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    console.log('🔑 Access token present:', !!accessToken);
    
    const { isAdmin, error } = await verifyAdmin(accessToken);
    
    if (!isAdmin) {
      console.error('❌ Admin verification failed:', error);
      return c.json({ error: error || 'Nicht autorisiert' }, 403);
    }

    const id = c.req.param('id');
    console.log('📝 Received ID parameter:', id);
    const messageKey = `message:${id}`;
    console.log('🔑 Constructed message key:', messageKey);
    
    // Try to get the message first for logging purposes
    let messageExists = false;
    try {
      const message = await kv.get(messageKey);
      if (message) {
        console.log('📧 Found message to delete:', { id: message.id, subject: message.subject, senderName: message.senderName });
        messageExists = true;
      } else {
        console.warn('⚠️ Message not found in KV store with key:', messageKey);
        // Check all messages to debug
        const allMessages = await kv.getByPrefix('message:');
        console.log('📋 Total messages in KV store:', allMessages.length);
        console.log('📋 All message IDs in KV store:', allMessages.map((m: any) => m.id));
        console.log('📋 Looking for ID:', id);
        const found = allMessages.find((m: any) => m.id === id);
        if (found) {
          console.log('🔍 Found message in array with matching ID:', found);
        }
      }
    } catch (checkError) {
      console.warn('⚠️ Error checking message existence:', checkError);
    }
    
    // Delete regardless of existence check
    console.log('🗑️ Executing delete operation for key:', messageKey);
    try {
      await kv.del(messageKey);
      console.log('✅ Delete operation executed successfully');
    } catch (delError) {
      console.error('�� Delete operation failed:', delError);
      throw delError;
    }
    
    // Verify deletion
    try {
      const stillExists = await kv.get(messageKey);
      if (stillExists) {
        console.error('⚠️ WARNING: Message still exists after deletion!', stillExists);
        return c.json({ 
          success: false,
          error: 'Nachricht konnte nicht gelöscht werden - noch vorhanden nach Löschversuch'
        }, 500);
      } else {
        console.log('✅ Verified: Message successfully deleted from KV store');
      }
    } catch (verifyError) {
      console.warn('⚠️ Error verifying deletion:', verifyError);
    }

    return c.json({ 
      success: true,
      message: 'Nachricht gelöscht',
      deletedId: id,
      deletedKey: messageKey
    });
  } catch (error) {
    console.error('❌ Delete message error:', error);
    return c.json({ 
      success: false,
      error: 'Ein Fehler ist aufgetreten beim Löschen der Nachricht',
      details: String(error)
    }, 500);
  }
});

// ========== TIME RESTRICTION SETTINGS ROUTES ==========

// Get time restriction settings
app.get('/make-server-fb86b8a8/admin/time-restrictions', async (c) => {
  try {
    console.log('[GET /admin/time-restrictions] Lade Zeitbeschränkungseinstellungen');
    
    const settings = await kv.get('time-restrictions');
    
    // Default settings if not set
    const defaultSettings = {
      enabled: true,
      blockStartHour: 12,
      blockEndHour: 17,
      blockWeekdaysOnly: true,
    };
    
    return c.json({ 
      settings: settings || defaultSettings
    });
  } catch (error) {
    console.error('Get time restrictions error:', error);
    return c.json({ error: 'Fehler beim Laden der Einstellungen' }, 500);
  }
});

// Update time restriction settings (Admin only)
app.put('/make-server-fb86b8a8/admin/time-restrictions', async (c) => {
  try {
    console.log('[PUT /admin/time-restrictions] START - Request erhalten');
    
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '');
    console.log('[PUT /admin/time-restrictions] Verifying admin access...');
    
    const { isAdmin, error } = await verifyAdmin(accessToken);
    
    if (!isAdmin) {
      console.error('[PUT /admin/time-restrictions] ❌ Admin-Verifizierung fehlgeschlagen:', error);
      return c.json({ error: error || 'Nicht autorisiert' }, 403);
    }

    console.log('[PUT /admin/time-restrictions] ✓ Admin-Zugriff bestätigt');

    const settings = await c.req.json();
    console.log('[PUT /admin/time-restrictions] Empfangene Settings:', settings);
    
    // Validate settings
    if (typeof settings.enabled !== 'boolean' ||
        typeof settings.blockStartHour !== 'number' ||
        typeof settings.blockEndHour !== 'number' ||
        typeof settings.blockWeekdaysOnly !== 'boolean') {
      console.error('[PUT /admin/time-restrictions] ❌ Ungültige Datentypen:', {
        enabled: typeof settings.enabled,
        blockStartHour: typeof settings.blockStartHour,
        blockEndHour: typeof settings.blockEndHour,
        blockWeekdaysOnly: typeof settings.blockWeekdaysOnly
      });
      return c.json({ error: 'Ungültige Einstellungen' }, 400);
    }
    
    console.log('[PUT /admin/time-restrictions] ✓ Datentypen korrekt');
    
    if (settings.blockStartHour < 0 || settings.blockStartHour > 23 ||
        settings.blockEndHour < 0 || settings.blockEndHour > 23) {
      console.error('[PUT /admin/time-restrictions] ❌ Stunden außerhalb des Bereichs 0-23');
      return c.json({ error: 'Stunden müssen zwischen 0 und 23 liegen' }, 400);
    }
    
    console.log('[PUT /admin/time-restrictions] ✓ Stunden im gültigen Bereich');
    
    if (settings.blockStartHour >= settings.blockEndHour) {
      console.error('[PUT /admin/time-restrictions] ❌ Startzeit >= Endzeit');
      return c.json({ error: 'Startzeit muss vor Endzeit liegen' }, 400);
    }
    
    console.log('[PUT /admin/time-restrictions] ✓ Zeitbereich gültig');
    
    await kv.set('time-restrictions', settings);
    console.log('[PUT /admin/time-restrictions] ✅ Settings erfolgreich gespeichert');
    
    return c.json({ 
      success: true,
      settings
    });
  } catch (error) {
    console.error('[PUT /admin/time-restrictions] ❌ FEHLER:', error);
    console.error('[PUT /admin/time-restrictions] ❌ Error stack:', error instanceof Error ? error.stack : 'N/A');
    return c.json({ 
      error: 'Ein Fehler ist aufgetreten',
      details: String(error)
    }, 500);
  }
});

// ========== LEGAL SETTINGS ROUTES ==========

// Get legal settings
app.get('/make-server-fb86b8a8/admin/legal-settings', async (c) => {
  try {
    console.log('[GET /admin/legal-settings] Lade rechtliche Einstellungen');
    
    const settings = await kv.get('legal-settings');
    
    return c.json({ 
      settings: settings || null
    });
  } catch (error) {
    console.error('Get legal settings error:', error);
    return c.json({ error: 'Fehler beim Laden der Einstellungen' }, 500);
  }
});

// Save legal settings (Admin only)
app.put('/make-server-fb86b8a8/admin/legal-settings', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.replace('Bearer ', '');
    const { isAdmin, error } = await verifyAdmin(accessToken);
    
    if (!isAdmin) {
      return c.json({ error: error || 'Nicht autorisiert' }, 403);
    }

    const settings = await c.req.json();
    
    await kv.set('legal-settings', settings);
    
    console.log('[PUT /admin/legal-settings] Rechtliche Einstellungen aktualisiert');
    
    return c.json({ 
      success: true,
      settings
    });
  } catch (error) {
    console.error('Save legal settings error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Get app logo
app.get("/make-server-fb86b8a8/admin/logo", async (c) => {
  try {
    const logo = await kv.get('app-logo');
    return c.json({ logo: logo || null });
  } catch (error) {
    console.error('Get logo error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Upload/Update app logo
app.put("/make-server-fb86b8a8/admin/logo", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin, error } = await verifyAdmin(accessToken);
    
    if (!isAdmin) {
      return c.json({ error: error || 'Nicht autorisiert' }, 403);
    }

    const body = await c.req.json();
    const { logo } = body;
    
    if (!logo) {
      return c.json({ error: 'Kein Logo bereitgestellt' }, 400);
    }

    await kv.set('app-logo', logo);
    
    console.log('[PUT /admin/logo] Logo aktualisiert');
    
    return c.json({ 
      success: true,
      logo
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Delete app logo (reset to default)
app.delete("/make-server-fb86b8a8/admin/logo", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin, error } = await verifyAdmin(accessToken);
    
    if (!isAdmin) {
      return c.json({ error: error || 'Nicht autorisiert' }, 403);
    }

    await kv.del('app-logo');
    
    console.log('[DELETE /admin/logo] Logo gelöscht (zurückgesetzt auf Standard)');
    
    return c.json({ 
      success: true,
      message: 'Logo auf Standard zurückgesetzt'
    });
  } catch (error) {
    console.error('Delete logo error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// ========== FORM DESIGN SETTINGS ROUTES ==========

// Get form design settings
app.get('/make-server-fb86b8a8/admin/form-design-settings', async (c) => {
  try {
    console.log('[GET /admin/form-design-settings] Loading form design settings');
    
    const settings = await kv.get('form-design-settings');
    
    // Default settings
    const defaultSettings = {
      showClassSelection: true,
      showHomeAloneQuestion: true,
      homeAloneQuestionPosition: "top",
      dayCardStyle: "card",
      showDayIcons: true,
      showDayColors: true,
      dropdownStyle: "default",
      labelStyle: "bold",
      spacing: "normal",
      showOtherTextField: true,
      colorTheme: "blue",
      timeSelectionType: "radio",
      allowMultipleTimeSelection: false,
      homeAloneInputType: "radio"
    };
    
    return c.json({ 
      settings: settings || defaultSettings
    });
  } catch (error) {
    console.error('Get form design settings error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Save form design settings (Admin only)
app.put('/make-server-fb86b8a8/admin/form-design-settings', async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin, error } = await verifyAdmin(accessToken);
    
    if (!isAdmin) {
      return c.json({ error: error || 'Nicht autorisiert' }, 403);
    }

    const settings = await c.req.json();
    
    await kv.set('form-design-settings', settings);
    
    console.log('[PUT /admin/form-design-settings] Settings updated:', settings);
    
    return c.json({ 
      success: true,
      settings
    });
  } catch (error) {
    console.error('Save form design settings error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// ========== DROPDOWN OPTIONS ROUTES ==========

// Get dropdown options
app.get('/make-server-fb86b8a8/admin/dropdown-options', async (c) => {
  try {
    console.log('[GET /admin/dropdown-options] Loading dropdown options');
    
    const settings = await kv.get('app:settings');
    
    // Default options
    const defaultOptions = {
      timeOptions: [
        { value: "nach-unterricht", label: "Nach dem Unterricht", enabled: true },
        { value: "nach-mittagessen", label: "Nach dem Mittagessen", enabled: true },
        { value: "mittagsbus", label: "Mittagsbus", enabled: true },
        { value: "nachmittagsbus", label: "Nachmittagsbus", enabled: true },
        { value: "14:00", label: "14:00 Uhr", enabled: true },
        { value: "15:00", label: "15:00 Uhr", enabled: true },
        { value: "16:00", label: "ab 16:00 Uhr", enabled: true },
        { value: "krank", label: "Krank", enabled: true },
        { value: "feiertag", label: "Feiertag", enabled: true },
        { value: "sonstiges", label: "Sonstiges:", enabled: true },
      ],
      classes: [
        { value: "1a", label: "1a", enabled: true },
        { value: "1b", label: "1b", enabled: true },
        { value: "2a", label: "2a", enabled: true },
        { value: "2b", label: "2b", enabled: true },
        { value: "3a", label: "3a", enabled: true },
        { value: "3b", label: "3b", enabled: true },
        { value: "4a", label: "4a", enabled: true },
        { value: "4b", label: "4b", enabled: true },
      ]
    };
    
    const options = {
      timeOptions: settings?.timeOptions || defaultOptions.timeOptions,
      classes: settings?.classes || defaultOptions.classes
    };
    
    return c.json({ options });
  } catch (error) {
    console.error('Get dropdown options error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// Save dropdown options (Admin only)
app.put('/make-server-fb86b8a8/admin/dropdown-options', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin, error } = await verifyAdmin(accessToken);
    
    if (!isAdmin) {
      return c.json({ error: error || 'Nicht autorisiert' }, 403);
    }

    const { options } = await c.req.json();
    
    // Update the app settings with new dropdown options
    const currentSettings = await kv.get('app:settings') || {};
    const updatedSettings = {
      ...currentSettings,
      timeOptions: options.timeOptions,
      classes: options.classes
    };
    
    await kv.set('app:settings', updatedSettings);
    
    console.log('[PUT /admin/dropdown-options] Options updated');
    
    return c.json({ 
      success: true,
      options
    });
  } catch (error) {
    console.error('Save dropdown options error:', error);
    return c.json({ error: 'Ein Fehler ist aufgetreten' }, 500);
  }
});

// ========== PWA & STATIC FILES ROUTES ==========

// Serve app-icon.svg
app.get('/app-icon.svg', (c) => {
  const svg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#8B5CF6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F59E0B;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="capGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FBBF24;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F59E0B;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="8"/>
      <feOffset dx="0" dy="4" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="512" height="512" rx="115" fill="url(#bgGradient)"/>
  <g transform="translate(256, 256)" filter="url(#shadow)">
    <path d="M -100 -60 L 0 -100 L 100 -60 L 0 -20 Z" fill="url(#capGradient)" stroke="#FFFFFF" stroke-width="4"/>
    <ellipse cx="0" cy="-60" rx="110" ry="25" fill="#FCD34D" opacity="0.9"/>
    <g transform="translate(100, -100)">
      <line x1="0" y1="0" x2="0" y2="40" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
      <circle cx="0" cy="45" r="8" fill="#FFFFFF"/>
    </g>
    <g transform="translate(0, 20)">
      <rect x="-70" y="0" width="140" height="100" rx="8" fill="#FFFFFF" opacity="0.95"/>
      <line x1="-50" y1="25" x2="50" y2="25" stroke="#3B82F6" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
      <line x1="-50" y1="45" x2="50" y2="45" stroke="#8B5CF6" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
      <line x1="-50" y1="65" x2="30" y2="65" stroke="#F59E0B" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
    </g>
    <g transform="translate(45, 60) rotate(25)">
      <rect x="-4" y="-45" width="8" height="50" fill="#F59E0B" rx="2"/>
      <polygon points="-4,-45 4,-45 0,-55" fill="#FCD34D"/>
      <rect x="-4" y="3" width="8" height="4" fill="#1F2937"/>
    </g>
  </g>
  <text x="256" y="440" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="#FFFFFF" text-anchor="middle" opacity="0.9">A</text>
</svg>`;
  
  c.header('Content-Type', 'image/svg+xml');
  c.header('Cache-Control', 'public, max-age=86400');
  return c.body(svg);
});

// Serve favicon.svg
app.get('/favicon.svg', (c) => {
  const svg = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#8B5CF6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F59E0B;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#bg)"/>
  <g transform="translate(32, 28)">
    <path d="M -14 -6 L 0 -12 L 14 -6 L 0 0 Z" fill="#FCD34D"/>
    <line x1="14" y1="-12" x2="14" y2="-4" stroke="#FFF" stroke-width="1.5"/>
    <circle cx="14" cy="-3" r="2" fill="#FFF"/>
  </g>
  <rect x="16" y="30" width="32" height="24" rx="2" fill="#FFFFFF" opacity="0.95"/>
  <line x1="20" y1="36" x2="44" y2="36" stroke="#3B82F6" stroke-width="2" opacity="0.5"/>
  <line x1="20" y1="42" x2="44" y2="42" stroke="#8B5CF6" stroke-width="2" opacity="0.5"/>
  <line x1="20" y1="48" x2="36" y2="48" stroke="#F59E0B" stroke-width="2" opacity="0.5"/>
</svg>`;
  
  c.header('Content-Type', 'image/svg+xml');
  c.header('Cache-Control', 'public, max-age=86400');
  return c.body(svg);
});

// Serve service-worker.js
app.get('/service-worker.js', (c) => {
  const sw = `// Service Worker for Hortzettel App PWA
const CACHE_NAME = 'hortzettel-app-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/app-icon.svg',
  '/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          (response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});`;
  
  c.header('Content-Type', 'application/javascript');
  c.header('Cache-Control', 'no-cache');
  return c.body(sw);
});

// Serve dynamic manifest.json
app.get('/manifest.json', async (c) => {
  try {
    console.log('[GET /manifest.json] Serving PWA manifest');
    
    // Load PWA settings from database
    const pwaSettings = await kv.get('pwa-settings');
    const schoolName = (await kv.get('school-name')) || 'Grundschule Auma';
    
    // Default manifest
    const manifest = {
      name: pwaSettings?.appName || `Hortzettel App - ${schoolName}`,
      short_name: pwaSettings?.appShortName || 'Hortzettel',
      description: pwaSettings?.appDescription || `Digitale Hortzettel-Verwaltung für ${schoolName}`,
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: pwaSettings?.backgroundColor || '#3B82F6',
      theme_color: pwaSettings?.themeColor || '#3B82F6',
      orientation: 'portrait-primary',
      icons: [
        {
          src: '/app-icon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any'
        },
        {
          src: '/app-icon.svg',
          sizes: '192x192 512x512',
          type: 'image/svg+xml',
          purpose: 'any maskable'
        }
      ],
      categories: ['education', 'productivity'],
      lang: 'de-DE',
      dir: 'ltr'
    };
    
    // Set proper content type
    c.header('Content-Type', 'application/manifest+json');
    
    return c.json(manifest);
  } catch (error) {
    console.error('Serve manifest error:', error);
    // Return default manifest on error
    c.header('Content-Type', 'application/manifest+json');
    return c.json({
      name: 'Hortzettel App',
      short_name: 'Hortzettel',
      start_url: '/',
      display: 'standalone',
      background_color: '#3B82F6',
      theme_color: '#3B82F6',
      icons: [
        {
          src: '/app-icon.svg',
          sizes: 'any',
          type: 'image/svg+xml'
        }
      ]
    });
  }
});

// Serve the user guide PDF
app.get("/make-server-fb86b8a8/guide-pdf", async (c) => {
  try {
    // Download PDF from the markdown-to-pdf service
    const pdfUrl = 'https://www.markdowntopdf.com/d/7f0f9460-3ad9-4ee6-8ba8-bc3e2cc599f1/download';
    
    const response = await fetch(pdfUrl);
    
    if (!response.ok) {
      console.error('Failed to fetch PDF:', response.status, response.statusText);
      return c.json({ error: 'PDF konnte nicht geladen werden' }, 500);
    }
    
    const pdfBuffer = await response.arrayBuffer();
    
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="Hortzettel Anleitung.pdf"',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error serving PDF:', error);
    return c.json({ error: 'Fehler beim Laden der PDF' }, 500);
  }
});

// Upload school photo
app.post('/make-server-fb86b8a8/upload-school-photo', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { isAdmin } = await verifyAdmin(accessToken);

    if (!isAdmin) {
      return c.json({ error: 'Unauthorized - Admin access required' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const bucketName = 'make-fb86b8a8-school-photos';

    // Create bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });
      console.log('[STORAGE] Created bucket:', bucketName);
    }

    // Get the file from the request
    const formData = await c.req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)' }, 400);
    }

    // Validate file size (5MB max)
    if (file.size > 5242880) {
      return c.json({ error: 'File too large. Maximum size is 5MB' }, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const filename = `school-photo-${timestamp}.${ext}`;

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filename, uint8Array, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('[STORAGE] Upload error:', uploadError);
      return c.json({ error: `Upload failed: ${uploadError.message}` }, 500);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filename);

    console.log('[STORAGE] File uploaded successfully:', urlData.publicUrl);

    return c.json({ 
      success: true, 
      url: urlData.publicUrl,
      filename: filename 
    });

  } catch (error: any) {
    console.error('[STORAGE] Error uploading school photo:', error);
    return c.json({ error: error.message || 'Upload failed' }, 500);
  }
});

Deno.serve(async (req, info) => {
  try {
    return await app.fetch(req, info);
  } catch (error) {
    // Suppress "Http: connection closed" errors which happen when client disconnects
    if (
      error instanceof Error && 
      (error.name === 'Http' || error.message.includes('connection closed'))
    ) {
      console.log('Info: Connection closed by client');
      return new Response(null, { status: 499 });
    }
    throw error;
  }
});
