import { getCurrentUser } from '@/lib/auth'
import { getGuestIdFromRequest } from '@/lib/guest-id'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { checkAndConsumeFeatureUsage } from '@/lib/usage-utils'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderSectionTitle(title: string): string {
  return `<h2 style="border-bottom: 1px solid #d1d5db; margin: 18px 0 8px; padding-bottom: 4px; font-size: 15px; color: #0f5132; text-transform: uppercase; letter-spacing: .06em;">${escapeHtml(title)}</h2>`
}

function buildResumeHtml(resume: any) {
  const skills = Array.isArray(resume.skills)
    ? resume.skills
    : String(resume.skills || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

  const contactRow = [resume.email, resume.phone, resume.location, resume.website]
    .filter(Boolean)
    .map((item) => escapeHtml(String(item)))
    .join(' | ')

  const experienceHtml = (resume.experience || [])
    .filter((exp: any) => exp.company || exp.position || exp.title)
    .map((exp: any) => {
      const bulletSource = Array.isArray(exp.bullets)
        ? exp.bullets
        : String(exp.bullets || '')
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)

      const bullets = bulletSource
        .filter((bullet: string) => bullet?.trim())
        .map((bullet: string) => `<li>${escapeHtml(bullet)}</li>`)
        .join('')

      return `
        <div style="margin-bottom: 10px;">
          <div style="display:flex; justify-content:space-between; gap:8px; align-items:baseline;">
            <strong>${escapeHtml(exp.position || exp.title || 'Role')}</strong>
            <span style="color:#4b5563; font-size:12px;">${escapeHtml(exp.duration || '')}</span>
          </div>
          <div style="color:#374151; font-size:13px; margin-bottom:4px;">${escapeHtml(exp.company || '')}</div>
          ${bullets ? `<ul style="margin:0; padding-left:18px; color:#1f2937;">${bullets}</ul>` : ''}
        </div>
      `
    })
    .join('')

  const educationHtml = (resume.education || [])
    .filter((edu: any) => edu.school || edu.degree)
    .map(
      (edu: any) => `
      <div style="margin-bottom: 8px;">
        <strong>${escapeHtml(edu.degree || '')}${edu.field ? `, ${escapeHtml(edu.field)}` : ''}</strong>
        <div style="display:flex; justify-content:space-between; gap:8px; font-size:13px; color:#4b5563;">
          <span>${escapeHtml(edu.school || '')}</span>
          <span>${escapeHtml(edu.year || '')}</span>
        </div>
      </div>
    `,
    )
    .join('')

  const certificationsHtml = (resume.certifications || [])
    .filter((cert: any) => cert.name)
    .map(
      (cert: any) => `
      <li>${escapeHtml(cert.name)}${cert.issuer ? `, ${escapeHtml(cert.issuer)}` : ''}${cert.year ? ` (${escapeHtml(cert.year)})` : ''}</li>
    `,
    )
    .join('')

  const projectsHtml = (resume.projects || [])
    .filter((project: any) => project.name)
    .map(
      (project: any) => `
      <div style="margin-bottom: 8px;">
        <strong>${escapeHtml(project.name)}</strong>
        ${project.description ? `<div style="font-size:13px; color:#374151;">${escapeHtml(project.description)}</div>` : ''}
      </div>
    `,
    )
    .join('')

  const optionalHtml = (resume.optionalSections || [])
    .filter((section: any) => section.title && section.content)
    .map(
      (section: any) => `
      ${renderSectionTitle(section.title)}
      <p style="margin:0; color:#1f2937; font-size:13px; white-space:pre-wrap;">${escapeHtml(section.content)}</p>
    `,
    )
    .join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(resume.fullName || 'Resume')}</title>
</head>
<body style="font-family: Calibri, Arial, sans-serif; margin: 36px; color: #111827; line-height: 1.45;">
  <h1 style="margin:0 0 4px; font-size: 28px; color:#064e3b;">${escapeHtml(resume.fullName || 'Your Name')}</h1>
  <div style="color:#374151; font-size:13px; margin-bottom:14px;">${contactRow}</div>

  ${resume.summary ? `${renderSectionTitle('Professional Summary')}<p style="margin:0; color:#1f2937; font-size:13px; white-space:pre-wrap;">${escapeHtml(resume.summary)}</p>` : ''}

  ${experienceHtml ? `${renderSectionTitle('Work Experience')}${experienceHtml}` : ''}
  ${skills.length ? `${renderSectionTitle('Skills')}<p style="margin:0; color:#1f2937; font-size:13px;">${skills.map(escapeHtml).join(', ')}</p>` : ''}
  ${educationHtml ? `${renderSectionTitle('Education')}${educationHtml}` : ''}
  ${certificationsHtml ? `${renderSectionTitle('Certifications')}<ul style="margin:0; padding-left:18px; color:#1f2937;">${certificationsHtml}</ul>` : ''}
  ${projectsHtml ? `${renderSectionTitle('Projects')}${projectsHtml}` : ''}
  ${optionalHtml}
</body>
</html>
  `
}

export async function POST(request: Request) {
  try {
    const resume = await request.json()
    const user = await getCurrentUser()
    const guestId = !user ? getGuestIdFromRequest(request) : null
    const supabase = await createServerSupabaseClient()

    if (!user && !guestId) {
      return Response.json({ error: 'Guest ID missing' }, { status: 400 })
    }

    const usageResult = await checkAndConsumeFeatureUsage('resume_downloads', {
      isGuest: !user,
      userId: user?.id ?? null,
      guestId,
    })

    if (!usageResult.ok) {
      if (usageResult.reason === 'limit_reached') {
        return Response.json(
          {
            error: 'limit_reached',
            feature: 'resume_downloads',
            limit: usageResult.limit,
            usageCount: usageResult.usageCount,
            window_expires_at: usageResult.windowExpiresAt,
            remaining_ms: usageResult.remainingMs,
            remaining_seconds: usageResult.remainingSeconds,
          },
          { status: 429 },
        )
      }
      return Response.json({ error: 'Failed to update usage' }, { status: 500 })
    }

    const htmlContent = buildResumeHtml(resume)
    const pdfBuffer = Buffer.from(htmlContent)
    const fileName = `${resume.fullName || 'resume'}.pdf`

    if (user) {
      await supabase.from('resume_download_history').insert({
        user_id: user.id,
        resume_data: resume,
        file_name: fileName,
      })
    }

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
