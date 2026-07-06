"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Editor, {
  BtnBold,
  BtnItalic,
  BtnLink,
  Toolbar,
  type ContentEditableEvent,
} from "react-simple-wysiwyg";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateEmailTemplate } from "@/lib/actions/email-template-actions";
import {
  defaultEmailTemplates,
  emailShell,
  type EmailTemplateKey,
  renderTemplateBody,
  supportedEmailTemplateVariables,
} from "@/lib/email-templates";
import { cn } from "@/lib/utils";

type EditableTemplate = {
  bodyHtml: string;
  id: string;
  subject: string;
  templateKey: EmailTemplateKey;
};

type EmailTemplatesEditorProps = {
  templates: EditableTemplate[];
};

type EditorMode = "simple" | "advanced";

const sampleVariables = {
  loan_officer_name: "Sarah Loan Officer",
  prospect_name: "John Smith",
};

const complexHtmlPattern = /<(?:!doctype|html|head|body|style|table|tr|td|img)\b/i;
const previewBaseWidth = 680;

export function EmailTemplatesEditor({ templates }: EmailTemplatesEditorProps) {
  const [activeKey, setActiveKey] = useState<EmailTemplateKey>(
    templates[0]?.templateKey ?? "WELCOME",
  );
  const [drafts, setDrafts] = useState(
    Object.fromEntries(
      templates.map((template) => [
        template.templateKey,
        {
          bodyHtml: template.bodyHtml,
          subject: template.subject,
        },
      ]),
    ) as Record<EmailTemplateKey, { bodyHtml: string; subject: string }>,
  );
  const [errors, setErrors] = useState({ bodyHtml: "", subject: "" });
  const [editorModes, setEditorModes] = useState(
    Object.fromEntries(
      templates.map((template) => [template.templateKey, "simple"]),
    ) as Record<EmailTemplateKey, EditorMode>,
  );
  const [advancedWarnings, setAdvancedWarnings] = useState(
    Object.fromEntries(
      templates.map((template) => [
        template.templateKey,
        complexHtmlPattern.test(template.bodyHtml),
      ]),
    ) as Record<EmailTemplateKey, boolean>,
  );
  const [isSaving, setIsSaving] = useState(false);
  const richEditorRef = useRef<HTMLDivElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [previewHeight, setPreviewHeight] = useState(760);
  const activeDraft = drafts[activeKey];
  const activeDefault = defaultEmailTemplates.find(
    (template) => template.templateKey === activeKey,
  );
  const activeMode = editorModes[activeKey];
  const previewHtml = useMemo(
    () =>
      emailShell(
        renderTemplateBody(activeDraft.bodyHtml, {
          loan_officer_name: sampleVariables.loan_officer_name,
          prospect_name: sampleVariables.prospect_name,
        }),
      ),
    [activeDraft.bodyHtml],
  );

  useEffect(() => {
    const updateScale = () => {
      const containerWidth = previewContainerRef.current?.clientWidth ?? previewBaseWidth;
      setPreviewScale(Math.min(1, containerWidth / previewBaseWidth));
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    const container = previewContainerRef.current;

    if (container) {
      resizeObserver.observe(container);
    }

    return () => resizeObserver.disconnect();
  }, []);

  function updatePreviewHeight() {
    const documentElement = previewFrameRef.current?.contentDocument?.documentElement;
    const body = previewFrameRef.current?.contentDocument?.body;
    const measuredHeight = Math.max(
      documentElement?.scrollHeight ?? 0,
      body?.scrollHeight ?? 0,
      760,
    );

    setPreviewHeight(measuredHeight);
  }

  function updateDraft(field: "bodyHtml" | "subject", value: string) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [activeKey]: {
        ...currentDrafts[activeKey],
        [field]: value,
      },
    }));
  }

  function setEditorMode(mode: EditorMode) {
    setEditorModes((currentModes) => ({
      ...currentModes,
      [activeKey]: mode,
    }));
  }

  function insertVariable(variable: string) {
    const placeholder = `{{${variable}}}`;

    if (activeMode === "simple") {
      richEditorRef.current?.focus();
      document.execCommand("insertText", false, placeholder);
      updateDraft("bodyHtml", richEditorRef.current?.innerHTML ?? activeDraft.bodyHtml);
      return;
    }

    updateDraft("bodyHtml", `${activeDraft.bodyHtml}${placeholder}`);
  }

  async function uploadHtmlFile(file: File | undefined) {
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".html")) {
      toast.error("Please upload an .html file.");
      return;
    }

    try {
      const fileContent = await file.text();
      updateDraft("bodyHtml", fileContent);
      setEditorModes((currentModes) => ({
        ...currentModes,
        [activeKey]: "advanced",
      }));
      setAdvancedWarnings((currentWarnings) => ({
        ...currentWarnings,
        [activeKey]: true,
      }));
      setErrors((currentErrors) => ({ ...currentErrors, bodyHtml: "" }));
      toast.success("HTML file loaded into the template body.");
    } catch {
      toast.error("Unable to read the HTML file.");
    }
  }

  async function saveTemplate() {
    const nextErrors = {
      bodyHtml: activeDraft.bodyHtml.trim() ? "" : "Body is required.",
      subject: activeDraft.subject.trim() ? "" : "Subject is required.",
    };

    setErrors(nextErrors);

    if (nextErrors.bodyHtml || nextErrors.subject) {
      return;
    }

    setIsSaving(true);

    const result = await updateEmailTemplate(
      activeKey,
      activeDraft.subject,
      activeDraft.bodyHtml,
    );

    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Email template saved.");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <Card className="border-mafi-border bg-mafi-bg-off shadow-sm">
        <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
          <CardTitle className="text-mafi-blue-primary">
            Template Editor
          </CardTitle>
          <CardDescription>
            Use raw HTML and the supported placeholders below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {defaultEmailTemplates.map((template) => (
              <button
                className={cn(
                  "min-h-10 shrink-0 rounded-md px-3 text-sm font-semibold transition",
                  activeKey === template.templateKey
                    ? "bg-mafi-blue-primary text-white"
                    : "bg-white text-mafi-text-dark hover:bg-mafi-bg-lighter hover:text-mafi-blue-primary",
                )}
                key={template.templateKey}
                onClick={() => {
                  setActiveKey(template.templateKey);
                  setErrors({ bodyHtml: "", subject: "" });
                }}
                type="button"
              >
                {template.label}
              </button>
            ))}
          </div>

          <div className="rounded-md border border-mafi-border bg-white p-3 text-xs text-mafi-text-mid">
            <p className="font-semibold text-mafi-text-dark">
              Supported variables
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {supportedEmailTemplateVariables.map((variable) => (
                <code
                  className="rounded bg-mafi-bg-light px-2 py-1 text-mafi-blue-primary"
                  key={variable}
                >
                  {variable}
                </code>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-md border border-mafi-border bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex rounded-md bg-mafi-bg-light p-1">
              {(["simple", "advanced"] as const).map((mode) => (
                <button
                  className={cn(
                    "min-h-9 rounded px-3 text-sm font-semibold transition",
                    activeMode === mode
                      ? "bg-mafi-blue-primary text-white"
                      : "text-mafi-text-dark hover:bg-white hover:text-mafi-blue-primary",
                  )}
                  key={mode}
                  onClick={() => setEditorMode(mode)}
                  type="button"
                >
                  {mode === "simple" ? "Simple Editor" : "Advanced (HTML)"}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-mafi-text-light">
                Insert variable
              </span>
              <Button
                onClick={() => insertVariable("prospect_name")}
                size="sm"
                type="button"
                variant="outline"
              >
                Prospect Name
              </Button>
              <Button
                onClick={() => insertVariable("loan_officer_name")}
                size="sm"
                type="button"
                variant="outline"
              >
                Loan Officer
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-template-subject">
              Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              aria-invalid={Boolean(errors.subject)}
              className={cn(errors.subject && "border-destructive")}
              id="email-template-subject"
              onChange={(event) => updateDraft("subject", event.target.value)}
              value={activeDraft.subject}
            />
            {errors.subject ? (
              <p className="text-sm text-destructive">{errors.subject}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            {activeMode === "simple" ? (
              <>
                <Label htmlFor="email-template-simple-body">
                  Body <span className="text-destructive">*</span>
                </Label>
                {advancedWarnings[activeKey] ? (
                  <p className="rounded-md border border-mafi-gold bg-mafi-gold-light/35 p-3 text-sm text-mafi-text-dark">
                    This template contains advanced formatting that may not
                    display correctly in Simple mode — switch to Advanced to
                    edit safely.
                  </p>
                ) : null}
                <Editor
                  containerProps={{
                    className: cn(
                      "rounded-md border border-mafi-border bg-white text-sm text-mafi-text-dark [&_.rsw-ce]:min-h-72 [&_.rsw-ce]:px-3 [&_.rsw-ce]:py-2 [&_.rsw-toolbar]:border-b [&_.rsw-toolbar]:border-mafi-border",
                      errors.bodyHtml && "border-destructive",
                    ),
                  }}
                  id="email-template-simple-body"
                  onChange={(event: ContentEditableEvent) =>
                    updateDraft("bodyHtml", event.target.value)
                  }
                  ref={richEditorRef}
                  value={activeDraft.bodyHtml}
                >
                  <Toolbar>
                    <BtnBold />
                    <BtnItalic />
                    <BtnLink />
                  </Toolbar>
                </Editor>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="email-template-body">
                      Body HTML <span className="text-destructive">*</span>
                    </Label>
                    <p className="max-w-xl text-xs text-mafi-text-light">
                      Upload a custom-designed HTML email file. Include{" "}
                      <code>{"{{prospect_name}}"}</code> and{" "}
                      <code>{"{{loan_officer_name}}"}</code> where you want
                      those values to appear.
                    </p>
                  </div>
                  <div>
                    <input
                      accept=".html,text/html"
                      className="sr-only"
                      id={`email-template-upload-${activeKey}`}
                      onChange={(event) => {
                        void uploadHtmlFile(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                      type="file"
                    />
                    <Label
                      className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md border border-mafi-border bg-white px-4 py-2 text-sm font-semibold text-mafi-text-dark transition hover:bg-mafi-bg-lighter hover:text-mafi-blue-primary"
                      htmlFor={`email-template-upload-${activeKey}`}
                    >
                      Upload HTML File
                    </Label>
                  </div>
                </div>
                <textarea
                  aria-invalid={Boolean(errors.bodyHtml)}
                  className={cn(
                    "min-h-80 w-full rounded-md border border-mafi-border bg-white px-3 py-2 font-mono text-sm text-mafi-text-dark outline-none focus:border-mafi-blue-primary focus:ring-2 focus:ring-mafi-blue-primary/20",
                    errors.bodyHtml && "border-destructive",
                  )}
                  id="email-template-body"
                  onChange={(event) =>
                    updateDraft("bodyHtml", event.target.value)
                  }
                  value={activeDraft.bodyHtml}
                />
              </>
            )}
            {errors.bodyHtml ? (
              <p className="text-sm text-destructive">{errors.bodyHtml}</p>
            ) : null}
          </div>

          <div className="flex justify-end">
            <Button disabled={isSaving} onClick={saveTemplate} type="button">
              {isSaving ? "Saving..." : `Save ${activeDefault?.label ?? "template"}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-mafi-border bg-mafi-bg-white shadow-sm">
        <CardHeader className="border-b border-mafi-border bg-mafi-bg-light">
          <CardTitle className="text-mafi-blue-primary">Live Preview</CardTitle>
          <CardDescription>
            Sample values: John Smith and Sarah Loan Officer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mafi-text-light">
              Subject
            </p>
            <p className="mt-1 font-semibold text-mafi-text-dark">
              {activeDraft.subject || "No subject"}
            </p>
          </div>
          <div
            className="overflow-hidden rounded-md border border-mafi-border bg-white"
            ref={previewContainerRef}
            style={{
              height: `${previewHeight * previewScale}px`,
            }}
          >
            <iframe
              className="block border-0 bg-white"
              onLoad={updatePreviewHeight}
              ref={previewFrameRef}
              sandbox=""
              srcDoc={previewHtml}
              style={{
                height: `${previewHeight}px`,
                transform: `scale(${previewScale})`,
                transformOrigin: "top left",
                width: `${previewBaseWidth}px`,
              }}
              title="Email template preview"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
