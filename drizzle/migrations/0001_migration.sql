
create policy "own video upload" on storage.objects for insert to authenticated with check (bucket_id='videos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own video read" on storage.objects for select to authenticated using (bucket_id='videos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own video delete" on storage.objects for delete to authenticated using (bucket_id='videos' and (storage.foldername(name))[1] = auth.uid()::text);
