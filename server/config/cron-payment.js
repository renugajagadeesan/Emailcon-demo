import Camhistory from "../models/Camhistory.js";
import cron from "node-cron";
import axios from "axios";
import apiConfig from "../../my-app/src/apiconfig/apiConfig.js";

console.log("Cron job started for sending scheduled payment emails.");

cron.schedule('0 * * * *', async () => {
    try {
        const nowUTC = new Date();
        const currentUTCHour = nowUTC.getUTCHours();
        const currentUTCMinute = nowUTC.getUTCMinutes();
        const currentDateStr = nowUTC.toISOString().split("T")[0]; // YYYY-MM-DD

        console.log("Checking payment campaigns at:", new Date().toLocaleString());

        const camhistories = await Camhistory.find({
            status: "Remainder On",
            campaignname: { $regex: /Payment Remainder/i }
        });

        for (const camhistory of camhistories) {
            const scheduled = new Date(camhistory.scheduledTime);
            if (
                scheduled.getUTCHours() !== currentUTCHour ||
                scheduled.getUTCMinutes() !== currentUTCMinute
            ) continue;

            let sentEmails = [];
            let failedEmails = [];

            // Filter students based on date match and lastSentDate check
            const studentsToSend = (camhistory.exceldata || []).filter(student => {
                if (!student.Date) return false; // Skip if no date exists
            
                const studentDateStr = student.Date.toString().slice(0, 10); // Ensure it's in YYYY-MM-DD format
            
                console.log("Comparing:", studentDateStr, currentDateStr);
            
                return studentDateStr === currentDateStr
            });
            
            if (studentsToSend.length === 0) {
                console.log(`No students matching today's date in campaign: ${camhistory.campaignname}`);
                continue;
            }

            await Promise.allSettled(studentsToSend.map(async (student) => {
                const personalizedContent = camhistory.previewContent.map(item => {
                    if (!item.content) return item;
                    let updatedContent = item.content;
                    const studentData = {
                        ...(student._doc || student),
                        ...student.additionalFields
                    };

                    Object.entries(studentData).forEach(([key, value]) => {
                        const regex = new RegExp(`\\{${key.trim()}\\}`, "gi");
                        updatedContent = updatedContent.replace(regex, value != null ? String(value).trim() : "");
                    });

                    return { ...item, content: updatedContent };
                });

                const emailData = {
                    recipientEmail: student.Email,
                    subject: camhistory.subject,
                    body: JSON.stringify(personalizedContent),
                    bgColor: camhistory.bgColor,
                    previewtext: camhistory.previewtext,
                    aliasName: camhistory.aliasName,
                    attachments: camhistory.attachments,
                    userId: camhistory.user,
                    groupId: camhistory.groupname,
                    campaignId: camhistory._id,
                };

                try {
                    await axios.post(`${apiConfig.baseURL}/api/stud/sendbulkEmail`, emailData);
                    sentEmails.push(student.Email);

                } catch (error) {
                    console.error(`❌ Failed to send email to ${student.Email}:`, error.message);
                    failedEmails.push(student.Email);
                }
            }));

            const total = camhistory.exceldata.length;
            const progress = total > 0 ? Math.round((sentEmails.length / total) * 100) : 0;

            // Save updated exceldata with new lastSentDate values
            await Camhistory.findByIdAndUpdate(camhistory._id, {
                exceldata: camhistory.exceldata,
                sendcount: sentEmails.length,
                failedcount: failedEmails.length,
                sentEmails,
                failedEmails,
                status: "Remainder On",
                progress
            });

            console.log(`✅ Campaign done for "${camhistory.campaignname}" — Sent: ${sentEmails.length}, Failed: ${failedEmails.length}`);
        }

    } catch (error) {
        console.error("❌ Error in payment cron job:", error.message);
    }
});
