import { describe,it,expect,vi } from "vitest";
import { MAX_AUDIO_SECONDS,creditsForDuration } from "@/lib/credits";
import { DEFAULT_STYLE,normalizeStyle,serializeStyle } from "@/lib/captions/style-schema";
import { CAPTION_PRESETS,presetStyle } from "@/lib/captions/presets";
import { FONT_REGISTRY } from "@/lib/captions/font-registry";
import { generateAss,escapeAss } from "@/lib/captions/ass-generator";
import { validateCaptionTiming } from "@/lib/captions/timing";
import { authorizeResolution,outputDimensions,validateRenderDuration } from "@/lib/rendering/render-validation";
import { estimateRenderCredits } from "@/lib/rendering/render-credits";
import { sourceExpired,outputExpired } from "@/lib/rendering/retention";
import { marketingEligible,announcementVisible } from "@/lib/admin/campaign-rules";
import { productSettingsSchema,DEFAULT_PRODUCT_SETTINGS } from "@/lib/admin/settings-schema";
import { assertOwner } from "@/lib/api/owner-auth";

describe("production limits",()=>{
 it("limits new videos to five minutes",()=>{expect(MAX_AUDIO_SECONDS).toBe(300);expect(()=>validateRenderDuration(300)).not.toThrow();expect(()=>validateRenderDuration(301)).toThrow();});
 it("preserves started-minute transcription pricing",()=>{expect(creditsForDuration(61)).toBe(2);expect(creditsForDuration(300)).toBe(5);});
 it("locks 4K for free users while allowing 1080p",()=>{expect(()=>authorizeResolution("4k",false)).toThrow();expect(()=>authorizeResolution("1080p",false)).not.toThrow();});
 it("unlocks 4K for verified paid customers",()=>{expect(()=>authorizeResolution("4k",true)).not.toThrow();});
 it("preserves portrait aspect ratio without upscaling",()=>{expect(outputDimensions("1080p",1080,1920)).toEqual({width:1080,height:1920});expect(outputDimensions("4k",640,360)).toEqual({width:640,height:360});});
 it("does not charge before approved render pricing",()=>{expect(estimateRenderCredits(61,"1080p",null)).toBeNull();expect(estimateRenderCredits(61,"1080p",{approved:false,creditsPerMinute:{"720p":2,"1080p":3,"4k":5}})).toBeNull();});
 it("uses separate configured render rates",()=>{expect(estimateRenderCredits(61,"4k",{approved:true,creditsPerMinute:{"720p":2,"1080p":3,"4k":5}})).toBe(10);});
});
describe("caption data",()=>{
 it("provides nine unique presets preserving existing IDs",()=>{expect(CAPTION_PRESETS).toHaveLength(9);expect(new Set(CAPTION_PRESETS.map((p)=>p.id)).size).toBe(9);for(const id of ["bold-pop","karaoke","minimal","boxed","neon","cinema"])expect(CAPTION_PRESETS.some((p)=>p.id===id)).toBe(true);});
 it("validates and serializes every preset",()=>{for(const p of CAPTION_PRESETS)expect(JSON.parse(serializeStyle(presetStyle(p.id))).presetId).toBe(p.id);});
 it("rejects invalid style sizes and color strings",()=>{expect(()=>normalizeStyle({...DEFAULT_STYLE,fontSize:-2})).toThrow();expect(()=>normalizeStyle({...DEFAULT_STYLE,textColor:"url(x)"})).toThrow();});
 it("supports four Telugu fonts and Mandali regular weight only",()=>{expect(FONT_REGISTRY.filter((f)=>f.telugu).map((f)=>f.family)).toEqual(["Noto Sans Telugu","Noto Serif Telugu","Hind Guntur","Mandali"]);expect(()=>normalizeStyle({...DEFAULT_STYLE,fontFamily:"Mandali",fontWeight:800})).toThrow();});
 it("preserves Telugu conjuncts, Roman, English and mixed text in ASS",()=>{for(const text of ["నమస్కారం, మీరు ఎలా ఉన్నారు?","క్ష శ్రీ క్రై గ్న","Namaskaram, meeru ela unnaru?","Welcome to ManaCaptions.","ఈ video చాలా బాగుంది."]){expect(generateAss([{id:"s",start:0,end:2,text}],DEFAULT_STYLE,1920,1080,2)).toContain(text);}});
 it("escapes ASS override injection",()=>{expect(escapeAss("{\\pos(0,0)}")).toBe("｛＼pos(0,0)｝");});
 it("uses real word timing in karaoke ASS",()=>{expect(generateAss([{id:"s",start:0,end:2,text:"hello",words:[{id:"w",text:"hello",start:0.5,end:1.5}]}],DEFAULT_STYLE,1920,1080,2)).toContain("{\\k50}{\\kf100}hello");});
 it("rejects captions and words outside media bounds",()=>{expect(()=>validateCaptionTiming([{id:"a",text:"x",start:0,end:301}],300)).toThrow();expect(()=>validateCaptionTiming([{id:"a",text:"x",start:1,end:2,words:[{id:"w",text:"x",start:0,end:2}]}],3)).toThrow();});
});
describe("retention and communication",()=>{
 const at="2026-11-01T00:00:00Z",now=Date.parse(at);
 it("expires source files after three days",()=>{expect(sourceExpired(at,false,now+72*3600000-1)).toBe(false);expect(sourceExpired(at,false,now+72*3600000)).toBe(true);});
 it("protects sources used by active rendering",()=>{expect(sourceExpired(at,true,now+100*3600000)).toBe(false);});
 it("expires completed downloads after exactly 24 hours",()=>{expect(outputExpired(at,now+24*3600000-1)).toBe(false);expect(outputExpired(at,now+24*3600000)).toBe(true);});
 it("requires explicit marketing consent",()=>{expect(marketingEligible(false,false,false)).toBe(false);});
 it("excludes suppressed and suspended customers",()=>{expect(marketingEligible(true,true,false)).toBe(false);expect(marketingEligible(true,false,true)).toBe(false);expect(marketingEligible(true,false,false)).toBe(true);});
 it("targets announcements by paid status",()=>{expect(announcementVisible("paid",false)).toBe(false);expect(announcementVisible("free",true)).toBe(false);expect(announcementVisible("all",false)).toBe(true);});
 it("rejects unapproved activation and invalid product limits",()=>{expect(productSettingsSchema.safeParse({...DEFAULT_PRODUCT_SETTINGS,maxVideoSeconds:301}).success).toBe(false);expect(productSettingsSchema.safeParse({...DEFAULT_PRODUCT_SETTINGS,renderPricingApproved:true}).success).toBe(false);});
});
describe("owner authorization",()=>{
 it("denies ordinary users at the server boundary",async()=>{const rpc=vi.fn().mockResolvedValue({data:false,error:null});await expect(assertOwner({supabase:{rpc} as never,userId:"user"})).rejects.toThrow("Owner access required");expect(rpc).toHaveBeenCalledWith("is_app_owner",{_user_id:"user"});});
 it("allows verified owner and denies lookup failures",async()=>{await expect(assertOwner({supabase:{rpc:vi.fn().mockResolvedValue({data:true,error:null})} as never,userId:"owner"})).resolves.toBeUndefined();await expect(assertOwner({supabase:{rpc:vi.fn().mockResolvedValue({data:true,error:{message:"error"}})} as never,userId:"owner"})).rejects.toThrow();});
});